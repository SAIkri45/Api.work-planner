import { flatten, safeParseAsync } from "valibot";
import UnprocessableContentException from "../exceptions/unprocessableContentException.js";
import { VAddUsersToProjectSchema, VCreateProjectSchema, VRemoveUsersFromProjectSchema, VUpdateProjectSchema } from "./schemas/vProjectSchema.js";
import { VCreateUserSchema } from "./schemas/vUserSchema.js";
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
