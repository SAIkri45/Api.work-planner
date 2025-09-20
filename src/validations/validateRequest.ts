import { flatten, safeParseAsync } from "valibot";

import type { AppActivity, ValidatedRequest } from "../types/appTypes.js";

import UnprocessableContentException from "../exceptions/unprocessableContentException.js";
import { VSignInSchema, VSignUpOrSignInSchema, VSignUpOrSignInVerifySchema } from "./schemas/signInSignUpValidationSchema.js";
import { VUserSigninSchema } from "./schemas/signinValidations.js";
import { VAddUsersToProjectSchema, VCreateProjectSchema, VRemoveUsersFromProjectSchema, VUpdateProjectSchema, VUpdateProjectStatusSchema } from "./schemas/vProjectSchema.js";
import { VAssignUsersToTaskSchema, VRemoveUsersFromTaskSchema } from "./schemas/vTaskAssigneesSchema.js";
import { VCreateTaskSchema, VUpdateTaskSchema, VUpdateTaskStatusSchema } from "./schemas/vTaskSchema.js";
import { VAddUserSchema, VCreateUserSchema, VUpdateUserSchema, VUpdateUserSchemaByLoginUser } from "./schemas/vUserSchema.js";

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
    case "add-users-to-project":
      schema = VAddUsersToProjectSchema;
      break;
    case "remove-users-from-project":
      schema = VRemoveUsersFromProjectSchema;
      break;
    case "update-project-status":
      schema = VUpdateProjectStatusSchema;
      break;
    case "create-task":
      schema = VCreateTaskSchema;
      break;
    case "update-task":
      schema = VUpdateTaskSchema;
      break;
    case "signup-or-signin":
      schema = VSignUpOrSignInSchema;
      break;
    case "signup-or-signin-verify":
      schema = VSignUpOrSignInVerifySchema;
      break;
    case "signin-verify":
      schema = VSignInSchema;
      break;
    case "signin":
      schema = VUserSigninSchema;
      break;
    case "update-user":
      schema = VUpdateUserSchema;
      break;
    case "add-users-to-task":
      schema = VAssignUsersToTaskSchema;
      break;
    case "remove-users-from-task":
      schema = VRemoveUsersFromTaskSchema;
      break;
    case "update-task-status":
      schema = VUpdateTaskStatusSchema;
      break;
    case "create-user-by-admin":
      schema = VAddUserSchema;
      break;
    case "update-emp":
      schema = VUpdateUserSchemaByLoginUser;
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
