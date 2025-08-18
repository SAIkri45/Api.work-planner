import { Context } from "hono";
import { slackConfig } from "../config/slckConfig";
import BadRequestException from "../exceptions/badRequestException";
import { ACCESS_TOKEN_NOT_FOUND, MISSING_CODE, USER_ACCESS_TOKEN_MISSING, USER_INFO_NOT_FOUND, USER_PROFILE_INFO_NOT_FOUND } from "../constants/appMessages";
import axios from 'axios'
import NotFoundException from "../exceptions/notFoundException";
import { sendSuccessResp } from "../utils/respUtils.js";
import { getOAuthCode } from "../helpers/oAuthHelper";

class slackOAuthController {

    slackOAuth = async (c: Context) => {
        const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackConfig.clientId}` +
            `&user_scope=${encodeURIComponent(slackConfig.userScope)}` + // <-- changed here
            `&redirect_uri=${encodeURIComponent(slackConfig.redirectUri)}`;

        console.log('[Slack OAuth] Redirecting to:', slackAuthUrl);
        return c.redirect(slackAuthUrl);
    }

    slackOAuthCallback = async (c: Context) => {

        const code = c.req.query('code');

        if (!code) {
            throw new BadRequestException(MISSING_CODE);
        }

        const result = await getOAuthCode(code);

        return sendSuccessResp(c, 200, 'Authorization successful!', { user: result });
    }

}
export default slackOAuthController;