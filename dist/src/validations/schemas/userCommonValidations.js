import { email as emailValidator, minLength, nonEmpty, pipe, string, transform } from "valibot";
import { EMAIL_MIN_LENGTH, EMAIL_REQUIRED, PASSWORD_MIN_LENGTH, PASSWORD_REQUIRED } from "../../constants/appMessages.js";
export const userEmail = pipe(string(EMAIL_REQUIRED), nonEmpty(EMAIL_REQUIRED), transform(value => value.trim().toLowerCase()), emailValidator(EMAIL_REQUIRED), minLength(8, EMAIL_MIN_LENGTH));
export const userPassword = pipe(string(PASSWORD_REQUIRED), nonEmpty(PASSWORD_REQUIRED), minLength(8, PASSWORD_MIN_LENGTH));
