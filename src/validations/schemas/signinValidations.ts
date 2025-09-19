import type { InferOutput } from "valibot";

import { email as emailValidator, nonEmpty, object, pipe, pipeAsync, string, transform } from "valibot";

import { EMAIL_MISSING, EMAIL_REQUIRED } from "../../constants/appMessages.js";
import { userPassword } from "./userCommonValidations.js";

export const VUserSigninSchema = pipeAsync(
  object({
    email: pipe(
      string(EMAIL_REQUIRED),
      nonEmpty(EMAIL_MISSING),
      transform(value => value.trim().toLowerCase()),
      emailValidator(EMAIL_REQUIRED),
    ),
    password: userPassword,
  }),
);

export type ValidatedUserSignin = InferOutput<typeof VUserSigninSchema>;
