import { email as emailValidator, minLength, nonEmpty, object, optional, picklist, pipe, pipeAsync, rawTransformAsync, regex, string, transform } from "valibot";
import { allowedUserStatuses, allowedUserTypes, DESIGNATION_INVALID, DESIGNATION_TOO_SHORT, EMAIL_EXISTS, EMAIL_INVALID, EMAIL_MISSING, NAME_INVALID, NAME_MISSING, NAME_TOO_SHORT, PHONE_INVALID, PHONE_MISSING, PROFILE_PIC_INVALID, SLACK_ID_INVALID, USER_STATUS_INVALID, USER_TYPE_INVALID } from "../../constants/appMessages.js";
import { userEmailExists } from "../customValidations.js";
import { prepareValibotIssue } from "../prepareValibotIssue.js";
import { userEmail, userPassword } from "./userCommonValidations.js";
// Phone regex
const phoneRegex = /^(\+91|\+91-|0)?[6-9]\d{9}$/;
// Create Legal Advisor or Advocate Schema
export const VCreateUserSchema = pipeAsync(object({
    user_name: pipe(string(NAME_INVALID), nonEmpty(NAME_MISSING), transform(value => value.trim()), minLength(3, NAME_TOO_SHORT)),
    // ✅ slack_id optional now
    slack_id: optional(pipe(string(SLACK_ID_INVALID), transform(value => value.trim()))),
    display_name: optional(string(NAME_INVALID)),
    phone: pipe(string(PHONE_INVALID), nonEmpty(PHONE_MISSING), regex(phoneRegex, PHONE_INVALID)),
    email: pipe(string(EMAIL_INVALID), nonEmpty(EMAIL_MISSING), emailValidator(EMAIL_INVALID)),
    // ✅ profile_pic optional now
    profile_pic: optional(string(PROFILE_PIC_INVALID)),
    // ✅ designation optional now
    designation: optional(pipe(string(DESIGNATION_INVALID), transform(value => value.trim()), minLength(3, DESIGNATION_TOO_SHORT))),
    // ✅ password still required
    password: pipe(string("Password is invalid"), nonEmpty("Password is required"), transform(value => value.trim()), minLength(6, "Password must be at least 6 characters")),
    // User Type (optional)
    user_type: optional(pipe(string(USER_TYPE_INVALID), transform(value => value.trim().toUpperCase()), nonEmpty(USER_TYPE_INVALID), picklist(allowedUserTypes, USER_TYPE_INVALID))),
    // User Status (optional)
    user_status: optional(pipe(string(USER_STATUS_INVALID), transform(value => value.trim().toUpperCase()), nonEmpty(USER_STATUS_INVALID), picklist(allowedUserStatuses, USER_STATUS_INVALID))),
}), 
// async validation hook
rawTransformAsync(async ({ dataset, addIssue }) => {
    const { email } = dataset.value;
    if (email && (await userEmailExists(email))) {
        prepareValibotIssue(dataset, addIssue, "email", email, EMAIL_EXISTS);
    }
    return dataset.value;
}));
export const VUpdateUserSchema = pipeAsync(object({
    user_name: pipe(string(NAME_INVALID), nonEmpty(NAME_MISSING), transform(value => value.trim()), minLength(3, NAME_TOO_SHORT)),
    email: pipe(string(EMAIL_INVALID), nonEmpty(EMAIL_MISSING), emailValidator(EMAIL_INVALID)),
    phone: pipe(string(PHONE_INVALID), nonEmpty(PHONE_MISSING), regex(phoneRegex, PHONE_INVALID)),
}));
// add user by the admin
export const VAddUserSchema = pipeAsync(object({
    email: userEmail,
    password: userPassword,
}));
