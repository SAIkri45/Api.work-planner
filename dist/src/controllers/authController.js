import bcrypt from "bcrypt";
import { INVALID_CREDENTIALS, LOGIN_VALIDATION_ERROR, USER_LOGIN } from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import UnAuthorizedException from "../exceptions/unauthorizedException.js";
import { getSingleRecordByMultipleColumnValues } from "../services/db/baseDbService.js";
import { genJWTTokensForUser } from "../utils/jwtUtils.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
export class AuthController {
    signInWithEmail = async (c) => {
        const requestbody = await c.req.json();
        const validated = await validateRequest("signin", requestbody, LOGIN_VALIDATION_ERROR);
        const columnsToSelect = ["id", "slack_id", "profile_pic", "designation", "display_name", "phone", "email", "user_type", "user_status", "created_at", "updated_at"];
        const userDetails = await getSingleRecordByMultipleColumnValues(users, ["email", "deleted_at", "user_status"], [validated.email, null, "ACTIVE"], [...columnsToSelect, "password"]);
        const isValidUser = userDetails?.email;
        const storedPassword = userDetails?.password || "";
        const comparePassword = await bcrypt.compare(validated.password, storedPassword);
        if (!isValidUser || !comparePassword) {
            throw new UnAuthorizedException(INVALID_CREDENTIALS);
        }
        const { access_token, refresh_token } = await genJWTTokensForUser(userDetails.id);
        const { password, ...userDataWithOutPassword } = userDetails;
        const result = {
            user_details: userDataWithOutPassword,
            access_token,
            refresh_token,
        };
        return sendSuccessResp(c, 200, USER_LOGIN, result);
    };
}
