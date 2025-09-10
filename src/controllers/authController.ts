// controllers/authController.ts
// controllers/authController.ts
import { Context } from "hono";
import { validateRequest } from "../validations/validateRequest.js";
import {
  VUserSigninSchema,
  ValidatedUserSignin,
} from "../validations/schemas/signinValidations.js";
import { users, User } from "../db/schema/users.js";
import {
  getMultipleRecordsByAColumnValue,
  saveSingleRecord,
  updateRecordById,
} from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";

export class AuthController {
  signInWithEmail = async (c: Context) => {
    try {
      //  Get request body
      const body = await c.req.json();

      //  Validate input (password must be 123456)
      const validated: ValidatedUserSignin = await validateRequest(
        "signin",
        body,
        "VUserSigninSchema"
      );

      //  Lookup user by email using existing base DB function
      let usersFound = await getMultipleRecordsByAColumnValue<User>(
        users,
        "email",
        validated.email
      );
      let user = usersFound?.[0] ?? null;

      //  If user does not exist → create default user using saveSingleRecord
      if (!user) {
        const newUserData: Partial<User> = {
          email: validated.email,
          password: "123456", // default password
          user_name: null,
        };
        user = await saveSingleRecord<User>(users, newUserData);
      } else {
        //  If user exists → update last login / flag
        user = await updateRecordById(users, user.id, {
          updated_at: new Date(),
        } as Partial<User>);
      }

      //  Return response
      return sendSuccessResp(c, 200, "Signed in successfully", {
        user,
        // accessToken: "mock-access-token",
        // refreshToken: "mock-refresh-token",
      });
    } catch (err: any) {
      console.error(err);
      return c.json({ message: err.message || "Something went wrong" }, 400);
    }
  };
}

// import type { Context } from "hono";
// import { validateRequest } from "../validations/validateRequest";
// import { deleteRecordById, getRecordById, getSingleRecordByAColumnValue, getSingleRecordByMultipleColumnValues, saveSingleRecord, updateRecordById } from "../services/db/baseDbService";
// import { User, users } from "../db/schema/users";
// import { sendSuccessResp } from "../utils/respUtils";
// import NotFoundException from "../exceptions/notFoundException";
// import { device_tokens, DeviceToken } from "../db/schema/deviceToken";
// import { ValidatedSignInVerification } from "../validations/schemas/signinValidations";
// import { setCookie } from "hono/cookie";
// import { appConfig } from "../config/appConfig";
// import { OTP, OTPs } from "../db/schema/otp";
// import UnauthorizedException from "../exceptions/unauthorizedException";
// import { refresh_tokens, RefreshToken } from "../db/schema/refreshToken";
// import { ValidatedSignIn, ValidatedSignUpOrSignIn, ValidatedSignUpOrSignInVerification } from "../validations/schemas/signInSignUpValidationSchema";
// import { prepareOTPData } from "../utils/otpUtils";
// import {USER_NOT_FOUND, OTP_SENT,LOGIN_DONE, LOGIN_EMAIL_NOT_FOUND, LOGIN_PHONE_NOT_FOUND,LOGIN_VALIDATION_ERROR,RT_NOT_FOUND, TOKENS_GENERATED} from "../constants/appMessages";
// import { genJWTTokensForUser, verifyJWTToken } from "../utils/jwtUtils";
// import  dayjs  from "dayjs";
// import utc from "dayjs/plugin/utc.js";
// dayjs.extend(utc);
// class AuthController {
//   //with phone number
//   signUpOrSignIn = async (c: Context) => {
//     const singUpOrSignInInputData = await c.req.json();
//     const validatedSignInOrSignUpData = await validateRequest<ValidatedSignUpOrSignIn>("signup-or-signin", singUpOrSignInInputData, LOGIN_VALIDATION_ERROR);
//     let user = await getSingleRecordByAColumnValue<User>(users, "phone", validatedSignInOrSignUpData.phone);
//     if (!user) {
//       validatedSignInOrSignUpData.is_new_user = true;
//       user = await saveSingleRecord<User>(users, validatedSignInOrSignUpData);
//     }
//     else if (user.is_verified) {
//       await updateRecordById<User>(users, user.id, { is_new_user: false });
//     }
//     const otpData = prepareOTPData(user, "SIGNIN_OR_SIGNUP");
//     await saveSingleRecord<OTP>(OTPs, otpData);
//     // await sendOTP(user.phone, otpData.otp);
//     return sendSuccessResp(c, 200, OTP_SENT);
//   };
//   signUpOrSignInVerify = async (c: Context) => {
//     const signUpOrSignInVerifyInputData = await c.req.json();
//     const validatedSignInOrSignUpVerifyData = await validateRequest<ValidatedSignUpOrSignInVerification>("signup-or-signin-verify", signUpOrSignInVerifyInputData, LOGIN_VALIDATION_ERROR);
//     let user = await getSingleRecordByAColumnValue<User>(users, "phone", validatedSignInOrSignUpVerifyData.phone);
//     if (!user) {
//       throw new NotFoundException(USER_NOT_FOUND);
//     }
//     // user = await updateRecordById<User>(users, user.id, { is_verified: true });
//     // if (validatedSignInOrSignUpVerifyData.device_token) {
//     //   // Step 1: Check if the device_token + user_id combo already exists
//     //   const checkDeviceTokenExists = await getSingleRecordByMultipleColumnValues<DeviceToken>(device_tokens, ["device_token", "user_id"], [validatedSignInOrSignUpVerifyData.device_token, user.id]);
//     //   // If the device_token + user_id combination already exists, no action is needed
//     //   if (!checkDeviceTokenExists) {
//     //     // Step 2: If the device_token + user_id combination doesn't exist, check if the user has logged in from another device
//     //     const existingDevice = await getSingleRecordByMultipleColumnValues<DeviceToken>(
//     //       device_tokens,
//     //       ["user_id"],
//     //       [user.id],
//     //     );
//     //     if (existingDevice) {
//     //       // :white_check_mark: Case 1: The user is logging in from a new device (device_token is different)
//     //       if (existingDevice.device_token !== validatedSignInOrSignUpVerifyData.device_token) {
//     //         // Insert a new record with the new device_token for the same user
//     //         await saveSingleRecord<DeviceToken>(device_tokens, {
//     //           device_token: validatedSignInOrSignUpVerifyData.device_token,
//     //           user_id: user.id,
//     //         });
//     //       }
//     //     }
//     //     else {
//     //       // :white_check_mark: Case 3: First-time login for the user → Store new token
//     //       await saveSingleRecord<DeviceToken>(device_tokens, {
//     //         device_token: validatedSignInOrSignUpVerifyData.device_token,
//     //         user_id: user.id
//     //       });
//     //     }
//     //   }
//     // }
//     const tokensData = await this._generateLoginTokensAndSaveToDB(user.id);
//     setCookie(c, "AUTHID", tokensData.access_token, { domain: appConfig.cookie_domain, httpOnly: true });
//     const { ...user_details } = user;
//     const respData = { ...tokensData, user_details };
//     return sendSuccessResp(c, 200, LOGIN_DONE, respData);
//   };
//   signInWithEmail = async (c: Context) => {
//     const signInInputData = await c.req.json();
//     const validatedSignInData = await validateRequest<ValidatedSignIn>("signin", signInInputData, LOGIN_VALIDATION_ERROR);
//     let user = await getSingleRecordByAColumnValue<User>(users, "email", validatedSignInData.email);
//     if (!user) {
//       validatedSignInData.is_new_user = true;
//       user = await saveSingleRecord<User>(users, validatedSignInData);
//     }
//     else if (user.is_verified) {
//       await updateRecordById<User>(users, user.id, { is_new_user: false });
//     }
//     const otpData = prepareOTPData(user, "SIGNIN_WITH_EMAIL", undefined, true);
//     await saveSingleRecord<OTP>(OTPs, otpData);
//     // if (user.email) {
//     //   // await sendOTP(user.email, otpData.otp);
//     // }
//     return sendSuccessResp(c, 200, OTP_SENT);
//   };
//   signInVerifyWithEmail = async (c: Context) => {
//     const signInVerifyInputData = await c.req.json();
//     const validatedSignInVerifyData = await validateRequest<ValidatedSignInVerification>(
//       "signin-verify",
//       signInVerifyInputData,
//       LOGIN_VALIDATION_ERROR,
//     );
//     let user = await getSingleRecordByAColumnValue<User>(users, "email", validatedSignInVerifyData.email);
//     if (!user) {
//       throw new NotFoundException(USER_NOT_FOUND);
//     }
//     user = await updateRecordById<User>(users, user.id, {
//       is_verified: true,
//     });
//     // Device Token Handling
//     // if (validatedSignInVerifyData.device_token) {
//     //   const checkDeviceTokenExists = await getSingleRecordByMultipleColumnValues<DeviceToken>(
//     //     device_tokens,
//     //     ["device_token", "user_id"],
//     //     [validatedSignInVerifyData.device_token, user.id],
//     //   );
//     //   if (!checkDeviceTokenExists) {
//     //     const existingDevice = await getSingleRecordByMultipleColumnValues<DeviceToken>(
//     //       device_tokens,
//     //       ["user_id"],
//     //       [user.id],
//     //     );
//     //     // The user is logging in from a new device (device_token is different)
//     //     if (existingDevice && existingDevice.device_token !== validatedSignInVerifyData.device_token) {
//     //       await saveSingleRecord<DeviceToken>(device_tokens, {
//     //         device_token: validatedSignInVerifyData.device_token,
//     //         user_id: user.id
//     //       });
//     //     }
//     //     else if (!existingDevice) {
//     //       // First-time login for the user → Store new token
//     //       await saveSingleRecord<DeviceToken>(device_tokens, {
//     //         device_token: validatedSignInVerifyData.device_token,
//     //         user_id: user.id
//     //       });
//     //     }
//     //   }
//     // }
//     const tokensData = await this._generateLoginTokensAndSaveToDB(user.id);
//     setCookie(c, "AUTHID", tokensData.access_token, {
//       domain: appConfig.cookie_domain,
//       httpOnly: true,
//     });
//     const { ...user_details } = user;
//     const respData = { ...tokensData, user_details };
//     return sendSuccessResp(c, 200, LOGIN_DONE, respData);
//   };
//   getTokensFromRefreshToken = async (c: Context) => {
//     const req = await c.req.json();
//     // Get Refresh Token from DB
//     const tokenColumnsToSelect = ["id", "user_id", "refresh_token", "expires_at"] as const;
//     const tokenRecord = await getSingleRecordByAColumnValue<RefreshToken, typeof tokenColumnsToSelect[number]>(refresh_tokens, "refresh_token", req.refresh_token, tokenColumnsToSelect);
//     // Check if provided Refresh Token matches with DB Refresh Token
//     if (!tokenRecord) {
//       throw new UnauthorizedException(RT_NOT_FOUND);
//     }
//     await verifyJWTToken(tokenRecord.refresh_token);
//     // Get User Record from DB (though you can use the decodedPayload, but it will be less secure as we are not sure if the user exists in the DB)
//     const columnsToSelect = ["id", "user_type"] as const;
//     const user = await getRecordById<User, typeof columnsToSelect[number]>(users, tokenRecord.user_id, columnsToSelect);
//     if (!user) {
//       throw new NotFoundException(USER_NOT_FOUND);
//     }
//     const tokensData = await this._generateLoginTokensAndSaveToDB(user.id);
//     // Delete Consumed Refresh Token from DB
//     await deleteRecordById<RefreshToken>(refresh_tokens, tokenRecord.id);
//     return sendSuccessResp(c, 200, TOKENS_GENERATED, tokensData);
//   };
//   _generateLoginTokensAndSaveToDB = async (userId: number) => {
//     // Generate JWT Tokens for the User
//     const { access_token, refresh_token, refresh_token_expires_at } = await genJWTTokensForUser(userId);
//     // Save Refresh Token to DB
//     const refreshTokenData = { user_id: userId, refresh_token, expires_at: refresh_token_expires_at };
//     await saveSingleRecord<RefreshToken>(refresh_tokens, refreshTokenData);
//     return { access_token, refresh_token, refresh_token_expires_at };
//   };
// }
// export default AuthController;
