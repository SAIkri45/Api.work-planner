import type { Context } from "hono";

import bcrypt from "bcrypt";

import type { User } from "../db/schema/users.js";
import type { userSignInRespData } from "../types/appTypes.js";
import type { ValidatedUserSignin } from "../validations/schemas/signinValidations.js";

import { INVALID_CREDENTIALS, LOGIN_VALIDATION_ERROR, USER_LOGIN } from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import NotFoundException from "../exceptions/notFoundException.js";
import { getSingleRecordByMultipleColumnValues } from "../services/db/baseDbService.js";
import { genJWTTokensForUser } from "../utils/jwtUtils.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";

export class AuthController {
  signInWithEmail = async (c: Context) => {
    const requestbody = await c.req.json();

    const validated = await validateRequest<ValidatedUserSignin>("signin", requestbody, LOGIN_VALIDATION_ERROR);

    const columnsToSelect = ["id", "slack_id", "profile_pic", "designation", "display_name", "phone", "email", "user_type", "user_status", "created_at", "updated_at", "password"] as const;

    const userDetails = await getSingleRecordByMultipleColumnValues<User>(users, ["email", "deleted_at", "user_status"], [validated.email, null, "ACTIVE"], columnsToSelect);

    if (!userDetails || !userDetails.email) {
      throw new NotFoundException(INVALID_CREDENTIALS);
    }

    const comparePassword = await bcrypt.compare(validated.password, userDetails?.password);

    if (!comparePassword) {
      throw new NotFoundException(INVALID_CREDENTIALS);
    }

    const { access_token, refresh_token } = await genJWTTokensForUser(userDetails.id);
    const { password, ...userDataWithOutPassword } = userDetails;

    const result: userSignInRespData = {
      user_details: userDataWithOutPassword,
      access_token,
      refresh_token,
    };

    return sendSuccessResp(c, 200, USER_LOGIN, result);
  };
}
