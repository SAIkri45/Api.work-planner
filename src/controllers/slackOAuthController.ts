import type { Context } from "hono";

import type { SlackToken } from "../db/schema/slackTokens.js";
import type { User } from "../db/schema/users.js";
import type { ValidatedCreateUserOrAdmin } from "../validations/schemas/vUserSchema.js";

import { slackConfig } from "../config/slackConfig.js";
import { MISSING_CODE, USER_VALIDATION_ERROR } from "../constants/appMessages.js";
import { slack_tokens } from "../db/schema/slackTokens.js";
import { users } from "../db/schema/users.js";
import BadRequestException from "../exceptions/badRequestException.js";
import { getOAuthCode, refreshSlackToken } from "../helpers/oAuthHelper.js";
import { getSlackId } from "../middlewares/slackMiddlewares.js";
import { saveSingleRecord } from "../services/db/baseDbService.js";
import { checkSlackUserExists, getByUserId, getSlackTokenByUserId, updateSlackToken } from "../services/db/slackOAuthService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";

class SlackOAuthController {
  slackOAuth = async (c: Context) => {
    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackConfig.clientId}`
      + `&user_scope=${encodeURIComponent(slackConfig.userScope)}` // <-- changed here
      + `&redirect_uri=${encodeURIComponent(slackConfig.redirectUri)}`;

    return sendSuccessResp(c, 200, "Slack OAuth Initiated", { authUrl: slackAuthUrl });
  };

  slackOAuthCallback = async (c: Context) => {
    const code = c.req.query("code");

    if (!code) {
      throw new BadRequestException(MISSING_CODE);
    }

    const { userData, tokenData } = await getOAuthCode(code);

    const checkUserExist = await checkSlackUserExists(userData.email);

    let result;
    if (!checkUserExist) {
      const validatedReq = await validateRequest<ValidatedCreateUserOrAdmin>("create-user", userData, USER_VALIDATION_ERROR);

      // save user to db
      result = await saveSingleRecord<User>(users, validatedReq);

      getSlackId(tokenData.user_id);
      // save slack tokens to db
      result = await saveSingleRecord<SlackToken>(slack_tokens, tokenData);

      return sendSuccessResp(c, 200, "Authorization successful", { user: result, token: tokenData });
    }
    else {
      const existingToken = await getSlackTokenByUserId(userData.slack_id);

      const now = Math.floor(Date.now() / 1000);
      let userDetails;
      if (existingToken && existingToken.expires_at > now) {
        // Token still valid → do nothing
        userDetails = await getByUserId(userData.slack_id);
        getSlackId(tokenData.user_id);
        return sendSuccessResp(c, 200, "Authorization successful", { user: userDetails, token: tokenData });
      }
      else {
        // 4. Refresh token
        const refreshed = await refreshSlackToken(existingToken.refresh_token);

        await updateSlackToken(existingToken.user_id!, refreshed);
        getSlackId(tokenData.user_id);
        return sendSuccessResp(c, 200, "Authorization successful", { user: userDetails, token: tokenData });
      }
    }
  };
}
export default SlackOAuthController;
