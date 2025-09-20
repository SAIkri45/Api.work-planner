import type { InferOutput } from "valibot";

import { email as emailValidator, minLength, nonEmpty, object, pipe, pipeAsync, string, transform } from "valibot";

import { EMAIL_REQUIRED, PASSWORD_MIN_LENGTH, PASSWORD_REQUIRED } from "../../constants/appMessages.js";

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
);

export type ValidatedUserSignin = InferOutput<typeof VUserSigninSchema>;
