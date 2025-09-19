import type { Context } from "hono";

import type { User } from "../db/schema/users.js";
import type {
  ValidatedUserSignin,
} from "../validations/schemas/signinValidations.js";

import { users } from "../db/schema/users.js";
import UnAuthorizedException from "../exceptions/unauthorizedException.js";
import {
  getSingleRecordByAColumnValue,
} from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";

export class AuthController {
  // User sign in with email + password
  signInWithEmail = async (c: Context) => {
    const body = await c.req.json();

    const validated = await validateRequest<ValidatedUserSignin>(
      "signin",
      body,
      "VUserSigninSchema",
    );

    const user = await getSingleRecordByAColumnValue<User>(users, "email", validated.email);
    if (!user || user.password !== validated.password) {
      throw new UnAuthorizedException("Invalid email or password");
    }

    return sendSuccessResp(c, 200, "Signed in successfully", user);
  };
}
