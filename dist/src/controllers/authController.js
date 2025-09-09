import { validateRequest } from "../validations/validateRequest";
import { deleteRecordById, getRecordById, getSingleRecordByAColumnValue, getSingleRecordByMultipleColumnValues, saveSingleRecord, updateRecordById } from "../services/db/baseDbService";
import { users } from "../db/schema/users";
import { sendSuccessResp } from "../utils/respUtils";
import NotFoundException from "../exceptions/notFoundException";
import { device_tokens } from "../db/schema/deviceToken";
import { setCookie } from "hono/cookie";
import { appConfig } from "../config/appConfig";
import { OTPs } from "../db/schema/otp";
import UnauthorizedException from "../exceptions/unauthorizedException";
import { refresh_tokens } from "../db/schema/refreshToken";
import { prepareOTPData } from "../utils/otpUtils";
import { USER_NOT_FOUND, OTP_SENT, LOGIN_DONE, LOGIN_VALIDATION_ERROR, RT_NOT_FOUND, TOKENS_GENERATED } from "../constants/appMessages";
import { genJWTTokensForUser, verifyJWTToken } from "../utils/jwtUtils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);
class AuthController {
    signUpOrSignIn = async (c) => {
        const singUpOrSignInInputData = await c.req.json();
        const validatedSignInOrSignUpData = await validateRequest("signup-or-signin", singUpOrSignInInputData, LOGIN_VALIDATION_ERROR);
        let user = await getSingleRecordByAColumnValue(users, "phone", validatedSignInOrSignUpData.phone);
        if (!user) {
            validatedSignInOrSignUpData.is_new_user = true;
            user = await saveSingleRecord(users, validatedSignInOrSignUpData);
        }
        else if (user.is_verified) {
            await updateRecordById(users, user.id, { is_new_user: false });
        }
        const otpData = prepareOTPData(user, "SIGNIN_OR_SIGNUP");
        await saveSingleRecord(OTPs, otpData);
        // await sendOTP(user.phone, otpData.otp);
        return sendSuccessResp(c, 200, OTP_SENT);
    };
    signUpOrSignInVerify = async (c) => {
        const signUpOrSignInVerifyInputData = await c.req.json();
        const validatedSignInOrSignUpVerifyData = await validateRequest("signup-or-signin-verify", signUpOrSignInVerifyInputData, LOGIN_VALIDATION_ERROR);
        let user = await getSingleRecordByAColumnValue(users, "phone", validatedSignInOrSignUpVerifyData.phone);
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        user = await updateRecordById(users, user.id, { is_verified: true });
        if (validatedSignInOrSignUpVerifyData.device_token) {
            // Step 1: Check if the device_token + user_id combo already exists
            const checkDeviceTokenExists = await getSingleRecordByMultipleColumnValues(device_tokens, ["device_token", "user_id"], [validatedSignInOrSignUpVerifyData.device_token, user.id]);
            // If the device_token + user_id combination already exists, no action is needed
            if (!checkDeviceTokenExists) {
                // Step 2: If the device_token + user_id combination doesn't exist, check if the user has logged in from another device
                const existingDevice = await getSingleRecordByMultipleColumnValues(device_tokens, ["user_id"], [user.id]);
                if (existingDevice) {
                    // :white_check_mark: Case 1: The user is logging in from a new device (device_token is different)
                    if (existingDevice.device_token !== validatedSignInOrSignUpVerifyData.device_token) {
                        // Insert a new record with the new device_token for the same user
                        await saveSingleRecord(device_tokens, {
                            device_token: validatedSignInOrSignUpVerifyData.device_token,
                            user_id: user.id,
                        });
                    }
                }
                else {
                    // :white_check_mark: Case 3: First-time login for the user → Store new token
                    await saveSingleRecord(device_tokens, {
                        device_token: validatedSignInOrSignUpVerifyData.device_token,
                        user_id: user.id
                    });
                }
            }
        }
        const tokensData = await this._generateLoginTokensAndSaveToDB(user.id);
        setCookie(c, "AUTHID", tokensData.access_token, { domain: appConfig.cookie_domain, httpOnly: true });
        const { ...user_details } = user;
        const respData = { ...tokensData, user_details };
        return sendSuccessResp(c, 200, LOGIN_DONE, respData);
    };
    signInWithEmail = async (c) => {
        const signInInputData = await c.req.json();
        const validatedSignInData = await validateRequest("signin", signInInputData, LOGIN_VALIDATION_ERROR);
        let user = await getSingleRecordByAColumnValue(users, "email", validatedSignInData.email);
        if (!user) {
            validatedSignInData.is_new_user = true;
            user = await saveSingleRecord(users, validatedSignInData);
        }
        else if (user.is_verified) {
            await updateRecordById(users, user.id, { is_new_user: false });
        }
        const otpData = prepareOTPData(user, "SIGNIN_WITH_EMAIL", undefined, true);
        await saveSingleRecord(OTPs, otpData);
        // if (user.email) {
        //   // await sendOTP(user.email, otpData.otp);
        // }
        return sendSuccessResp(c, 200, OTP_SENT);
    };
    signInVerifyWithEmail = async (c) => {
        const signInVerifyInputData = await c.req.json();
        const validatedSignInVerifyData = await validateRequest("signin-verify", signInVerifyInputData, LOGIN_VALIDATION_ERROR);
        let user = await getSingleRecordByAColumnValue(users, "email", validatedSignInVerifyData.email);
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        user = await updateRecordById(users, user.id, {
            is_verified: true,
        });
        // Device Token Handling
        if (validatedSignInVerifyData.device_token) {
            const checkDeviceTokenExists = await getSingleRecordByMultipleColumnValues(device_tokens, ["device_token", "user_id"], [validatedSignInVerifyData.device_token, user.id]);
            if (!checkDeviceTokenExists) {
                const existingDevice = await getSingleRecordByMultipleColumnValues(device_tokens, ["user_id"], [user.id]);
                // The user is logging in from a new device (device_token is different)
                if (existingDevice && existingDevice.device_token !== validatedSignInVerifyData.device_token) {
                    await saveSingleRecord(device_tokens, {
                        device_token: validatedSignInVerifyData.device_token,
                        user_id: user.id
                    });
                }
                else if (!existingDevice) {
                    // First-time login for the user → Store new token
                    await saveSingleRecord(device_tokens, {
                        device_token: validatedSignInVerifyData.device_token,
                        user_id: user.id
                    });
                }
            }
        }
        const tokensData = await this._generateLoginTokensAndSaveToDB(user.id);
        setCookie(c, "AUTHID", tokensData.access_token, {
            domain: appConfig.cookie_domain,
            httpOnly: true,
        });
        const { ...user_details } = user;
        const respData = { ...tokensData, user_details };
        return sendSuccessResp(c, 200, LOGIN_DONE, respData);
    };
    getTokensFromRefreshToken = async (c) => {
        const req = await c.req.json();
        // Get Refresh Token from DB
        const tokenColumnsToSelect = ["id", "user_id", "refresh_token", "expires_at"];
        const tokenRecord = await getSingleRecordByAColumnValue(refresh_tokens, "refresh_token", req.refresh_token, tokenColumnsToSelect);
        // Check if provided Refresh Token matches with DB Refresh Token
        if (!tokenRecord) {
            throw new UnauthorizedException(RT_NOT_FOUND);
        }
        await verifyJWTToken(tokenRecord.refresh_token);
        // Get User Record from DB (though you can use the decodedPayload, but it will be less secure as we are not sure if the user exists in the DB)
        const columnsToSelect = ["id", "user_type"];
        const user = await getRecordById(users, tokenRecord.user_id, columnsToSelect);
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        const tokensData = await this._generateLoginTokensAndSaveToDB(user.id);
        // Delete Consumed Refresh Token from DB
        await deleteRecordById(refresh_tokens, tokenRecord.id);
        return sendSuccessResp(c, 200, TOKENS_GENERATED, tokensData);
    };
    _generateLoginTokensAndSaveToDB = async (userId) => {
        // Generate JWT Tokens for the User
        const { access_token, refresh_token, refresh_token_expires_at } = await genJWTTokensForUser(userId);
        // Save Refresh Token to DB
        const refreshTokenData = { user_id: userId, refresh_token, expires_at: refresh_token_expires_at };
        await saveSingleRecord(refresh_tokens, refreshTokenData);
        return { access_token, refresh_token, refresh_token_expires_at };
    };
}
export default AuthController;
