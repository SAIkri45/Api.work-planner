import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { email, literal, nonEmpty, object, optional, pipe, pipeAsync, rawTransformAsync, string, union } from "valibot";
import { DEVICE_TYPE_INVALID, DEVICE_TYPE_MISSING, EMAIL_INVALID, EMAIL_MISSING, OTP_DOES_NOT_MATCH, OTP_EXPIRED } from "../../constants/appMessages.js";
import { OTPs } from "../../db/schema/otp.js";
import { deleteRecordById, getSingleRecordByMultipleColumnValues } from "../../services/db/baseDbService.js";
import { isOtpExpiresForEmail } from "../customValidations.js";
import { prepareValibotIssue } from "../prepareValibotIssue.js";
dayjs.extend(utc);
// Schema Validation: Phone and OTP fields
export const VSignInVerifySchema = pipeAsync(object({
    email: pipe(string("Email must be a string"), nonEmpty(EMAIL_MISSING), email(EMAIL_INVALID)),
    otp: pipe(string("OTP must be a string"), nonEmpty("OTP is missing")),
    device_token: optional(string()),
    device_type: pipe(string(DEVICE_TYPE_INVALID), nonEmpty(DEVICE_TYPE_MISSING), union([literal("mobile"), literal("web")])),
}), 
// Custom validation logic for OTP match and expiry
rawTransformAsync(async ({ dataset, addIssue }) => {
    const { email, otp } = dataset.value;
    const isOtpRecordMatched = await getSingleRecordByMultipleColumnValues(OTPs, ["email", "action", "otp"], [email, "SIGNIN_WITH_EMAIL", otp]);
    if (!isOtpRecordMatched) {
        prepareValibotIssue(dataset, addIssue, "otp", otp, OTP_DOES_NOT_MATCH);
        return dataset.value;
    }
    const isOtpRecordExpired = await isOtpExpiresForEmail(email, "SIGNIN_WITH_EMAIL", otp);
    if (!isOtpRecordExpired) {
        prepareValibotIssue(dataset, addIssue, "otp", otp, OTP_EXPIRED);
        return dataset.value;
    }
    if (isOtpRecordExpired) {
        await deleteRecordById(OTPs, isOtpRecordMatched.id);
    }
    return dataset.value;
}));
