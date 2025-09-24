import type { InferOutput } from "valibot";

import { email as emailValidator, minLength, nonEmpty, object, pipe, pipeAsync, rawTransformAsync, string, transform } from "valibot";

import { EMAIL_REQUIRED, LOGIN_EMAIL_NOT_FOUND, PASSWORD_MIN_LENGTH, PASSWORD_REQUIRED } from "../../constants/appMessages.js";
import { checkEmailExist } from "../customValidations.js";
import { prepareValibotIssue } from "../prepareValibotIssue.js";

export const VUserSigninSchema = pipeAsync(
  object({
    email: pipe(
      string(EMAIL_REQUIRED),
      nonEmpty(EMAIL_REQUIRED),
      transform(value => value.trim().toLowerCase()),
      emailValidator(EMAIL_REQUIRED),
    ),
    password: pipe(
      string(PASSWORD_REQUIRED),
      nonEmpty(PASSWORD_REQUIRED),
      minLength(8, PASSWORD_MIN_LENGTH),
    ),

  }),
  rawTransformAsync(async ({ dataset, addIssue }) => {
    const { email } = dataset.value;
    const emailNotExist = await checkEmailExist(email);
    if (email && emailNotExist) {
      prepareValibotIssue(dataset, addIssue, "email", email, LOGIN_EMAIL_NOT_FOUND);
    }
    return dataset.value;
  }),
);

export type ValidatedUserSignin = InferOutput<typeof VUserSigninSchema>;
