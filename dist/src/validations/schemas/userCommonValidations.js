import { email as emailValidator, minLength, nonEmpty, number, pipe, regex, string, transform } from "valibot";
import { DESIGNATION_REQUIRED, EMAIL_MIN_LENGTH, EMAIL_REQUIRED, INVALID_EMAIL, INVALID_PHONE_NUMBER, PASSWORD_MIN_LENGTH, PASSWORD_REQUIRED, USER_ID_REQUIRED, USER_NAME_MIN_LENGTH, USER_NAME_REQUIRED, USER_PHONE_REQUIRED } from "../../constants/appMessages.js";
export const userEmail = pipe(string(EMAIL_REQUIRED), nonEmpty(EMAIL_REQUIRED), transform(value => value.trim().toLowerCase()), emailValidator(INVALID_EMAIL), minLength(8, EMAIL_MIN_LENGTH));
export const userPassword = pipe(string(PASSWORD_REQUIRED), nonEmpty(PASSWORD_REQUIRED), minLength(8, PASSWORD_MIN_LENGTH));
export const userPhone = pipe(string(USER_PHONE_REQUIRED), nonEmpty(USER_PHONE_REQUIRED), regex(/^\d+$/, INVALID_PHONE_NUMBER), regex(/^[6-9]\d{9}$/, INVALID_PHONE_NUMBER));
export const userDesignation = pipe(string(DESIGNATION_REQUIRED), nonEmpty(DESIGNATION_REQUIRED));
export const userName = pipe(string(USER_NAME_REQUIRED), nonEmpty(USER_NAME_REQUIRED), minLength(3, USER_NAME_MIN_LENGTH));
export const userId = pipe(number(USER_ID_REQUIRED));
