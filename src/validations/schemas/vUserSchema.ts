import type { InferOutput } from "valibot";

import { email as emailValidator, minLength, nonEmpty, object, optional, picklist, pipe, pipeAsync, rawTransformAsync, regex, string, transform } from "valibot";

import { allowedUserStatuses, allowedUserTypes, DESIGNATION_INVALID, DESIGNATION_TOO_SHORT, EMAIL_EXISTS, EMAIL_INVALID, EMAIL_MISSING, NAME_INVALID, NAME_MISSING, NAME_TOO_SHORT, PHONE_EXISTS, PHONE_INVALID, PHONE_MISSING, PROFILE_PIC_INVALID, SLACK_ID_INVALID, USER_STATUS_INVALID, USER_STATUS_REQUIRED, USER_TYPE_INVALID, USER_TYPE_REQUIRED } from "../../constants/appMessages.js";
import { checkEmailAndPhoneExist, checkEmailAndPhoneExistExceptUserId, userEmailExists } from "../customValidations.js";
import { prepareValibotIssue } from "../prepareValibotIssue.js";
import { userDesignation, userEmail, userId, userName, userPassword, userPhone } from "./userCommonValidations.js";

// Phone regex
const phoneRegex = /^(\+91|\+91-|0)?[6-9]\d{9}$/;


export const VCreateUserSchema = pipeAsync(
  object({
    user_name: pipe(
      string(NAME_INVALID),
      nonEmpty(NAME_MISSING),
      transform(value => value.trim()),
      minLength(3, NAME_TOO_SHORT),
    ),

    // ✅ slack_id optional now
    slack_id: optional(
      pipe(
        string(SLACK_ID_INVALID),
        transform(value => value.trim()),
      ),
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

    // ✅ profile_pic optional now
    profile_pic: optional(string(PROFILE_PIC_INVALID)),

    // ✅ designation optional now
    designation: optional(
      pipe(
        string(DESIGNATION_INVALID),
        transform(value => value.trim()),
        minLength(3, DESIGNATION_TOO_SHORT),
      ),
    ),

    // ✅ password still required
    password: pipe(
      string("Password is invalid"),
      nonEmpty("Password is required"),
      transform(value => value.trim()),
      minLength(6, "Password must be at least 6 characters"),
    ),

    // User Type (optional)
    user_type: optional(
      pipe(
        string(USER_TYPE_INVALID),
        transform(value => value.trim().toUpperCase()),
        nonEmpty(USER_TYPE_INVALID),
        picklist(allowedUserTypes, USER_TYPE_INVALID),
      ),
    ),

    // User Status (optional)
    user_status: optional(
      pipe(
        string(USER_STATUS_INVALID),
        transform(value => value.trim().toUpperCase()),
        nonEmpty(USER_STATUS_INVALID),
        picklist(allowedUserStatuses, USER_STATUS_INVALID),
      ),
    ),
  }),

  // async validation hook
  rawTransformAsync(async ({ dataset, addIssue }) => {
    const { email } = dataset.value;
    if (email && (await userEmailExists(email))) {
      prepareValibotIssue(dataset, addIssue, "email", email, EMAIL_EXISTS);
    }
    return dataset.value;
  }),
);

export const VUpdateUserSchema = pipeAsync(
  object({
    user_name: pipe(
      string(NAME_INVALID),
      nonEmpty(NAME_MISSING),
      transform(value => value.trim()),
      minLength(3, NAME_TOO_SHORT),
    ),
    email: pipe(
      string(EMAIL_INVALID),
      nonEmpty(EMAIL_MISSING),
      emailValidator(EMAIL_INVALID),
    ),
    phone: pipe(
      string(PHONE_INVALID),
      nonEmpty(PHONE_MISSING),
      regex(phoneRegex, PHONE_INVALID),
    ),
  }),
);

// add user by the admin
export const VAddUserSchema = pipeAsync(
  object({
    display_name: userName,
    email: userEmail,
    password: userPassword,
    phone: userPhone,
    designation: userDesignation,
    user_type: pipe(
      string(USER_TYPE_REQUIRED),
      transform(value => value.trim().toUpperCase()),
      nonEmpty(USER_TYPE_REQUIRED),
      picklist(allowedUserTypes, USER_TYPE_INVALID),
    )
  }),
  rawTransformAsync(async ({ dataset, addIssue }) => {
    const { email, phone } = dataset.value;

    const { emailExists, phoneExists } = await checkEmailAndPhoneExist(email, phone);

    if (emailExists) {
      prepareValibotIssue(dataset, addIssue, "email", email, EMAIL_EXISTS);
    }

    if (phoneExists) {
      prepareValibotIssue(dataset, addIssue, "phone", phone, PHONE_EXISTS);
    }

    return dataset.value;
  }),
);

// Update user
export const VUpdateUserSchemaByLoginUser = pipeAsync(
  object({
    id: userId,
    email: userEmail,
    display_name: userName,
    designation: userDesignation,
    phone: userPhone,
    user_type: pipe(
      string(USER_TYPE_REQUIRED),
      transform(value => value.trim().toUpperCase()),
      nonEmpty(USER_TYPE_REQUIRED),
      picklist(allowedUserTypes, USER_TYPE_INVALID),
    )
  }),
  rawTransformAsync(async ({ dataset, addIssue }) => {
    const { email, phone, id } = dataset.value;

    const { emailExists, phoneExists } = await checkEmailAndPhoneExistExceptUserId(email, phone, id);

    if (emailExists) {
      prepareValibotIssue(dataset, addIssue, "email", email, EMAIL_EXISTS);
    }

    if (phoneExists) {
      prepareValibotIssue(dataset, addIssue, "phone", phone, PHONE_EXISTS);
    }

    return dataset.value;
  }),
);

export const VUserStatusSchema = pipeAsync(
  object({
    user_status: pipe(
      string(USER_STATUS_REQUIRED),
      transform(value => value.trim().toUpperCase()),
      nonEmpty(USER_STATUS_REQUIRED),
      picklist(allowedUserStatuses, USER_STATUS_REQUIRED),
    ),
  }),
);

export const VUpdateUserPasswordSchema = pipeAsync(
  object({
    password: userPassword,
  }),
);

export type ValidatedCreateUserOrAdmin = InferOutput<typeof VCreateUserSchema>;
export type ValidatedUpdateUser = InferOutput<typeof VUpdateUserSchema>;
export type ValidatedAddUser = InferOutput<typeof VAddUserSchema>;
export type ValidatedUpdateUserByLoginEmp = InferOutput<typeof VUpdateUserSchemaByLoginUser>;
export type ValidatedUpdateUserStatus = InferOutput<typeof VUserStatusSchema>;
export type ValidatedUpdateUserPassword = InferOutput<typeof VUpdateUserPasswordSchema>;
