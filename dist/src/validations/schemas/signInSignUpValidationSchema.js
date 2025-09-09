import { boolean, email, literal, nonEmpty, object, optional, pipe, pipeAsync, rawTransformAsync, regex, string, union } from "valibot";
import { EMAIL_INVALID, EMAIL_MISSING, OTP_DOES_NOT_MATCH, OTP_EXPIRED, PHONE_INVALID, PHONE_MISSING, DEVICE_TYPE_MISSING, DEVICE_TYPE_INVALID } from "../../constants/appMessages.js";
import { OTPs } from "../../db/schema/otp.js";
import { getSingleRecordByMultipleColumnValues, deleteRecordById } from "../../services/db/baseDbService.js";
import { prepareValibotIssue } from "../prepareValibotIssue.js";
import { isOtpExpiresForPhone } from "../customValidations.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);
export const VSignUpOrSignInSchema = object({
    phone: pipe(string(PHONE_INVALID), nonEmpty(PHONE_MISSING), regex(/^(\+91|\+91-|0)?[6-9]\d{9}$/, PHONE_INVALID)),
    is_new_user: optional(boolean()),
});
// Schema Validation: Phone and OTP fields
export const VSignUpOrSignInVerifySchema = pipeAsync(object({
    phone: pipe(string(PHONE_INVALID), nonEmpty(PHONE_MISSING), regex(/^(\+91|\+91-|0)?[6-9]\d{9}$/, PHONE_INVALID)),
    otp: pipe(string("OTP must be a string"), nonEmpty("OTP is missing")),
    device_token: optional(string()),
    device_type: pipe(string(DEVICE_TYPE_INVALID), nonEmpty(DEVICE_TYPE_MISSING), union([literal("mobile"), literal("web")])),
}), 
// Custom validation logic for OTP match and expiry
rawTransformAsync(async ({ dataset, addIssue }) => {
    const { phone, otp } = dataset.value;
    const isOtpRecordMatched = await getSingleRecordByMultipleColumnValues(OTPs, ["phone", "action", "otp"], [phone, "SIGNIN_OR_SIGNUP", otp]);
    if (!isOtpRecordMatched) {
        prepareValibotIssue(dataset, addIssue, "otp", otp, OTP_DOES_NOT_MATCH);
        return dataset.value;
    }
    const isOtpRecordExpired = await isOtpExpiresForPhone(phone, "SIGNIN_OR_SIGNUP", otp);
    if (!isOtpRecordExpired) {
        prepareValibotIssue(dataset, addIssue, "otp", otp, OTP_EXPIRED);
        return dataset.value;
    }
    if (isOtpRecordExpired) {
        await deleteRecordById(OTPs, isOtpRecordMatched.id);
    }
    return dataset.value;
}));
export const VSignInSchema = object({
    email: pipe(string("Email must be a string"), nonEmpty(EMAIL_MISSING), email(EMAIL_INVALID)),
    is_new_user: optional(boolean()),
});
