import { email as emailValidator, nonEmpty, object, pipe, pipeAsync, string, transform } from "valibot";
import { EMAIL_INVALID, EMAIL_REQUIRED, PASSWORD_REQUIRED } from "../../constants/appMessages.js";
export const VUserSigninSchema = pipeAsync(object({
    email: pipe(string(EMAIL_REQUIRED), nonEmpty(EMAIL_REQUIRED), transform(value => value.trim().toLowerCase()), emailValidator(EMAIL_INVALID)),
    password: pipe(string(PASSWORD_REQUIRED), nonEmpty(PASSWORD_REQUIRED)),
}));
