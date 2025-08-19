import { flatten, safeParseAsync } from "valibot";

import type { AppActivity, ValidatedRequest } from "../types/appTypes.js";

import UnprocessableContentException from "../exceptions/unprocessableContentException.js";
import { VCreateUserSchema } from "./schemas/vUserSchema.js";

export async function validateRequest<R extends ValidatedRequest>(
  actionType: AppActivity,
  reqData: any,
  errorMessage: string,
) {
  let schema;

  switch (actionType) {
    case "create-user":
      schema = VCreateUserSchema;
      break;
    default:
  }

  const validation = await safeParseAsync(schema!, reqData, {
    abortPipeEarly: true,
  });

  if (!validation.success) {
    throw new UnprocessableContentException(
      errorMessage,
      flatten(validation.issues).nested,
    );
  }

  return validation.output as R;
}
