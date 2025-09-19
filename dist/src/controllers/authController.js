import { users } from "../db/schema/users.js";
import UnAuthorizedException from "../exceptions/unauthorizedException.js";
import { getSingleRecordByAColumnValue, } from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
export class AuthController {
    // User sign in with email + password
    signInWithEmail = async (c) => {
        const body = await c.req.json();
        const validated = await validateRequest("signin", body, "VUserSigninSchema");
        const user = await getSingleRecordByAColumnValue(users, "email", validated.email);
        if (!user || user.password !== validated.password) {
            throw new UnAuthorizedException("Invalid email or password");
        }
        return sendSuccessResp(c, 200, "Signed in successfully", user);
    };
}
