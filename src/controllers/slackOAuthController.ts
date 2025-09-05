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
import { genJWTTokensForUser } from "../utils/jwtUtils.js";

class SlackOAuthController {
  slackOAuth = async (c: Context) => {
    try {
      const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackConfig.clientId}`
        + `&user_scope=${encodeURIComponent(slackConfig.userScope)}`
        + `&redirect_uri=${encodeURIComponent(slackConfig.redirectUri)}`;

      return sendSuccessResp(c, 200, "Slack OAuth Initiated", { authUrl: slackAuthUrl });
    }
    catch (error) {
      throw error;
    }
  };

  slackOAuthCallback = async (c: Context) => {
    try {
      const code = c.req.query("code");
      const error = c.req.query("error");

      // Handle OAuth errors from Slack
      if (error) {
        throw new BadRequestException(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new BadRequestException(MISSING_CODE);
      }

      const { userData, tokenData } = await getOAuthCode(code);

      const checkUserExist = await checkSlackUserExists(userData.email);

      let result;
      if (!checkUserExist) {
        const validatedReq = await validateRequest<ValidatedCreateUserOrAdmin>("create-user", userData, USER_VALIDATION_ERROR);

        // Save user to db
        result = await saveSingleRecord<User>(users, validatedReq);

        // Save slack tokens to db
        await saveSingleRecord<SlackToken>(slack_tokens, tokenData);
        getSlackId(tokenData.user_id);

        // Generate JWT tokens
        const jwtTokens = await genJWTTokensForUser(result.id);

        // Return both Slack tokens and JWT tokens
        return sendSuccessResp(c, 200, "Authorization successful", { user: result, slack_token: tokenData, jwt_token: jwtTokens });
      }
      else {
        // User exists, check for existing token
        const existingToken = await getSlackTokenByUserId(userData.slack_id);
        const now = Math.floor(Date.now() / 1000);

        const userDetails = await getByUserId(userData.slack_id);

        // Generate JWT tokens for existing user
        const jwtTokens = await genJWTTokensForUser(userDetails.id);

        if (existingToken && existingToken.expires_at > now) {
          // Token still valid
          getSlackId(tokenData.user_id);
          return sendSuccessResp(c, 200, "Authorization successful", { user: userDetails, slack_token: tokenData, jwt_token: jwtTokens });
        }
        else if (existingToken && existingToken.refresh_token) {
          // Token exists but expired, try to refresh
          try {
            const refreshed = await refreshSlackToken(existingToken.refresh_token);
            await updateSlackToken(existingToken.user_id!, refreshed);

            getSlackId(tokenData.user_id);
            return sendSuccessResp(c, 200, "Authorization successful", { user: userDetails, slack_token: refreshed, jwt_token: jwtTokens });
          }
          catch (refreshError) {
            // If refresh fails, save the new token
            await saveSingleRecord<SlackToken>(slack_tokens, tokenData);

            getSlackId(tokenData.user_id);
            return sendSuccessResp(c, 200, "Authorization successful", { user: userDetails, slack_token: tokenData, jwt_token: jwtTokens });
          }
        }
        else {
          // No existing token or no refresh token available, save new one
          await saveSingleRecord<SlackToken>(slack_tokens, tokenData);

          getSlackId(tokenData.user_id);
          return sendSuccessResp(c, 200, "Authorization successful", { user: userDetails, slack_token: tokenData, jwt_token: jwtTokens });
        }
      }
    }
    catch (error) {
      throw error;
    }
  };
}
export default SlackOAuthController;
