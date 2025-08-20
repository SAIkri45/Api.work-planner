import { slackConfig } from "../config/slackConfig.js";
import { MISSING_CODE, USER_VALIDATION_ERROR } from "../constants/appMessages.js";
import { slack_tokens } from "../db/schema/slackTokens.js";
import { users } from "../db/schema/user.js";
import BadRequestException from "../exceptions/badRequestException.js";
import { getOAuthCode, refreshSlackToken } from "../helpers/oAuthHelper.js";
import { saveSingleRecord } from "../services/db/baseDbService.js";
import { checkSlackUserExists, getSlackTokenByUserId, updateSlackToken } from "../services/db/slackOAuthService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
class SlackOAuthController {
    slackOAuth = async (c) => {
        const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackConfig.clientId}`
            + `&user_scope=${encodeURIComponent(slackConfig.userScope)}` // <-- changed here
            + `&redirect_uri=${encodeURIComponent(slackConfig.redirectUri)}`;
        return c.json({
            authUrl: slackAuthUrl,
            message: "Use this URL to authorize with Slack",
        });
    };
    slackOAuthCallback = async (c) => {
        const code = c.req.query("code");
        if (!code) {
            throw new BadRequestException(MISSING_CODE);
        }
        const { userData, tokenData } = await getOAuthCode(code);
        const checkUserExist = await checkSlackUserExists(userData.email);
        let result;
        if (!checkUserExist) {
            const validatedReq = await validateRequest("create-user", userData, USER_VALIDATION_ERROR);
            // save user to db
            result = await saveSingleRecord(users, validatedReq);
            // save slack tokens to db
            await saveSingleRecord(slack_tokens, tokenData);
        }
        else {
            const existingToken = await getSlackTokenByUserId(userData.slack_id);
            const now = Math.floor(Date.now() / 1000);
            if (existingToken && existingToken.expires_at > now) {
                // Token still valid → do nothing
            }
            else {
                // 4. Refresh token
                const refreshed = await refreshSlackToken(existingToken.refresh_token);
                await updateSlackToken(existingToken.user_id, refreshed);
            }
        }
        return sendSuccessResp(c, 200, "Authorization successful!", { user: result });
    };
}
export default SlackOAuthController;
