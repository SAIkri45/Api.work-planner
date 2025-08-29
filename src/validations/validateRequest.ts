import { flatten, safeParseAsync } from "valibot";
import type { AppActivity, ValidatedRequest } from "../types/appTypes.js";
import UnprocessableContentException from "../exceptions/unprocessableContentException.js";
import { VCreateProjectSchema, VUpdateProjectSchema } from "./schemas/vProjectSchema.js";
import { VCreateUserSchema } from "./schemas/vUserSchema.js";
import { VCreateTaskSchema } from "./schemas/vTaskSchema.js";

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
    case "create-project":
      schema = VCreateProjectSchema;
      break;
    case "update-project":
      schema = VUpdateProjectSchema;
      break;
    case "create-task":
      schema = VCreateTaskSchema;
      break;
    default:
      break;
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
