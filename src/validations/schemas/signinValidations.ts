
import { object, string, pipe, nonEmpty, email as emailValidator, rawTransformAsync } from "valibot";
import { EMAIL_INVALID, EMAIL_MISSING } from "../../constants/appMessages.js";
import type { InferOutput } from "valibot";
import { users } from "../../db/schema/users.js";
import { pipeAsync } from "valibot";

// custom password validator
const validateDefaultPassword = rawTransformAsync(async ({ dataset, addIssue }: { dataset: { value: { email: string; password: string } }, addIssue: (issue: any) => void }) => {
  const { password } = dataset.value;

  if (password !== "123456") {
    addIssue({
      validation: "password",
      message: "Invalid password",
      input: password,
      path: ["password"],
    });
  }

  return dataset.value;
});

export const VUserSigninSchema = pipeAsync(
  object({
    email: pipe(
      string(EMAIL_INVALID),
      nonEmpty(EMAIL_MISSING),
      emailValidator(EMAIL_INVALID)
    ),
    password: pipe(
      string("Invalid password"),
      nonEmpty("Password is required")
    ),
  }),
  validateDefaultPassword // ✅ enforce 123456 here
);

export type ValidatedUserSignin = InferOutput<typeof VUserSigninSchema>;




// import type { InferOutput } from "valibot";

// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc.js";
// import { email, literal, nonEmpty, object, optional, pipe, pipeAsync, rawTransformAsync, string, union } from "valibot";


// import { DEVICE_TYPE_INVALID, DEVICE_TYPE_MISSING, EMAIL_INVALID, EMAIL_MISSING, OTP_DOES_NOT_MATCH, OTP_EXPIRED } from "../../constants/appMessages.js";
// import { OTPs,OTP } from "../../db/schema/otp.js";
// import { deleteRecordById, getSingleRecordByMultipleColumnValues } from "../../services/db/baseDbService.js";
// import { isOtpExpiresForEmail } from "../customValidations.js";
// import { prepareValibotIssue } from "../prepareValibotIssue.js";

// dayjs.extend(utc);

// // Schema Validation: Phone and OTP fields
// export const VSignInVerifySchema = pipeAsync(
//   object({
//     email: pipe(
//       string("Email must be a string"),
//       nonEmpty(EMAIL_MISSING),
//       email(EMAIL_INVALID),
//     ),

//     otp: pipe(
//       string("OTP must be a string"),
//       nonEmpty("OTP is missing"),
//     ),

//     device_token: optional(string()),
//     device_type: pipe(
//       string(DEVICE_TYPE_INVALID),
//       nonEmpty(DEVICE_TYPE_MISSING),
//       union([literal("mobile"), literal("web")]),
//     ),

//   }),

//   // Custom validation logic for OTP match and expiry
//   rawTransformAsync(async ({ dataset, addIssue }) => {
//     const { email, otp } = dataset.value as ValidatedSignInVerification;

//     const isOtpRecordMatched = await getSingleRecordByMultipleColumnValues<OTP>(OTPs, ["email", "action", "otp"], [email, "SIGNIN_WITH_EMAIL", otp]);

//     if (!isOtpRecordMatched) {
//       prepareValibotIssue(dataset, addIssue, "otp", otp, OTP_DOES_NOT_MATCH);
//       return dataset.value;
//     }

//     const isOtpRecordExpired = await isOtpExpiresForEmail(email, "SIGNIN_WITH_EMAIL", otp);

//     if (!isOtpRecordExpired) {
//       prepareValibotIssue(dataset, addIssue, "otp", otp, OTP_EXPIRED);
//       return dataset.value;
//     }

//     if (isOtpRecordExpired) {
//       await deleteRecordById(OTPs, isOtpRecordMatched.id);
//     }

//     return dataset.value;
//   }),

// );

// export type ValidatedSignInVerification = InferOutput<typeof VSignInVerifySchema>;