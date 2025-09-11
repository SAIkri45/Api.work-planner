import { flatten, safeParseAsync } from "valibot";
import UnprocessableContentException from "../exceptions/unprocessableContentException.js";
import { VAddUsersToProjectSchema, VCreateProjectSchema, VRemoveUsersFromProjectSchema, VUpdateProjectSchema, VUpdateProjectStatusSchema } from "./schemas/vProjectSchema.js";
import { VCreateUserSchema } from "./schemas/vUserSchema.js";
import { VCreateTaskSchema } from "./schemas/vTaskSchema.js";
import { VSignInSchema, VSignUpOrSignInSchema, VSignUpOrSignInVerifySchema } from "./schemas/signInSignUpValidationSchema.js";
export async function validateRequest(actionType, reqData, errorMessage) {
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
        case "create-task":
            schema = VCreateTaskSchema;
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
            schema = VSignInSchema;
            break;
        case "update-user":
            schema = VCreateUserSchema;
            break;
        default:
            break;
    }
    const validation = await safeParseAsync(schema, reqData, {
        abortPipeEarly: true,
    });
    if (!validation.success) {
        throw new UnprocessableContentException(errorMessage, flatten(validation.issues).nested);
    }
    return validation.output;
}
