import { Context } from "hono";
import { slackConfig } from "../config/slckConfig";
import BadRequestException from "../exceptions/badRequestException";
import { ACCESS_TOKEN_NOT_FOUND, MISSING_CODE, USER_ACCESS_TOKEN_MISSING, USER_INFO_NOT_FOUND, USER_PROFILE_INFO_NOT_FOUND, USER_VALIDATION_ERROR } from "../constants/appMessages";
import axios from 'axios'
import NotFoundException from "../exceptions/notFoundException";
import { sendSuccessResp } from "../utils/respUtils.js";
import { getOAuthCode } from "../helpers/oAuthHelper";
import { validateRequest } from "../validations/validateRequest";
import { ValidatedCreateUserOrAdmin } from "../validations/schemas/vUserSchema";
import { User, users } from "../db/schema/user";
import { saveSingleRecord } from "../services/db/baseDbService";

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

        const userData = await getOAuthCode(code);

        const validatedReq = await validateRequest<ValidatedCreateUserOrAdmin>("create-user", userData, USER_VALIDATION_ERROR)

        //save user to db
        const result = await saveSingleRecord<User>(users, validatedReq)

        return sendSuccessResp(c, 200, 'Authorization successful!', { user: result });
    }

}
export default slackOAuthController;