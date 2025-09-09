import type { InferOutput } from "valibot";
import { partial } from "valibot";

import { email as emailValidator, minLength, nonEmpty, object, optional, picklist, pipe, pipeAsync, rawTransformAsync, regex, string, transform } from "valibot";

import { allowedUserStatuses, allowedUserTypes, DESIGNATION_INVALID, DESIGNATION_MISSING, DESIGNATION_TOO_SHORT, EMAIL_EXISTS, EMAIL_INVALID, EMAIL_MISSING, NAME_INVALID, NAME_MISSING, NAME_TOO_SHORT, PHONE_INVALID, PHONE_MISSING, PROFILE_PIC_INVALID, PROFILE_PIC_MISSING, SLACK_ID_INVALID, SLACK_ID_MISSING, USER_STATUS_INVALID, USER_TYPE_INVALID } from "../../constants/appMessages.js";
import { userEmailExists } from "../customValidations.js";
import { prepareValibotIssue } from "../prepareValibotIssue.js";

// Phone regex
const phoneRegex = /^(\+91|\+91-|0)?[6-9]\d{9}$/;

// Create Legal Advisor or Advocate Schema
export const VCreateUserSchema = pipeAsync(
  object({
    user_name: pipe(
      string(NAME_INVALID),
      nonEmpty(NAME_MISSING),
      transform(value => value.trim()),
      minLength(3, NAME_TOO_SHORT),
    ),
    slack_id: pipe(
      string(SLACK_ID_INVALID),
      nonEmpty(SLACK_ID_MISSING),
      transform(value => value.trim()),
    ),
    display_name: optional(string(NAME_INVALID)),
    phone: pipe(
      string(PHONE_INVALID),
      nonEmpty(PHONE_MISSING),
      regex(phoneRegex, PHONE_INVALID),
    ),
    email: pipe(
      string(EMAIL_INVALID),
      nonEmpty(EMAIL_MISSING),
      emailValidator(EMAIL_INVALID),
    ),
    profile_pic: pipe(
      string(PROFILE_PIC_INVALID),
      nonEmpty(PROFILE_PIC_MISSING),
    ),
    designation: pipe(
      string(DESIGNATION_INVALID),
      nonEmpty(DESIGNATION_MISSING),
      transform(value => value.trim()),
      minLength(3, DESIGNATION_TOO_SHORT),
    ),
    // active: optional(boolean()),
    // User Type
    user_type: optional(
      pipe(
        string(USER_TYPE_INVALID),
        transform(value => value.trim().toUpperCase()),
        nonEmpty(USER_TYPE_INVALID),
        picklist(allowedUserTypes, USER_TYPE_INVALID),
      ),
    ),

    user_status: optional(
      pipe(
        string(USER_STATUS_INVALID),
        transform(value => value.trim().toUpperCase()),
        nonEmpty(USER_STATUS_INVALID),
        picklist(allowedUserStatuses, USER_STATUS_INVALID),
      ),
    ),

  }),
  rawTransformAsync(async ({ dataset, addIssue }) => {
    const { email } = dataset.value;
    if (email && await userEmailExists(email)) {
      prepareValibotIssue(dataset, addIssue, "email", email, EMAIL_EXISTS);
    }
    return dataset.value;
  }),
);

// Types
export type ValidatedCreateUserOrAdmin = InferOutput<typeof VCreateUserSchema>;


