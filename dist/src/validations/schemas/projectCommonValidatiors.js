import { array, minLength, nonEmpty, nullish, number, optional, picklist, pipe, string, transform } from "valibot";
import { allowedProjectStatus, PROJECT_DESCRIPTION_REQUIRED, PROJECT_DESCRIPTION_TOO_SHORT, PROJECT_NAME_TOO_SHORT, PROJECT_REQUIRED, PROJECT_STATUS_REQUIRED } from "../../constants/appMessages.js";
import ConflictException from "../../exceptions/conflictException.js";
export const projectTile = pipe(string(PROJECT_REQUIRED), nonEmpty(PROJECT_REQUIRED), transform(value => value.trim().toLocaleLowerCase()), minLength(3, PROJECT_NAME_TOO_SHORT));
export const ProjectDescription = pipe(string(PROJECT_DESCRIPTION_REQUIRED), nonEmpty(PROJECT_DESCRIPTION_REQUIRED), transform(value => value.trim()), minLength(3, PROJECT_DESCRIPTION_TOO_SHORT));
export const projectStatus = optional(pipe(string(PROJECT_STATUS_REQUIRED), nonEmpty(PROJECT_STATUS_REQUIRED), transform(value => value.trim().toUpperCase()), picklist(allowedProjectStatus, PROJECT_STATUS_REQUIRED)));
export const projectStartDate = pipe(string("start_date is required"), transform((value) => {
    // Strict YYYY-MM-DD format validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new ConflictException("Invalid start_date format. Use YYYY-MM-DD format.");
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!(date.getTime())) {
        throw new ConflictException("Invalid start_date. Please provide a valid date.");
    }
    return date;
}));
export const projectDueDate = optional(pipe(string("due_date must be a string"), transform((value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new ConflictException("Invalid due_date format. Use YYYY-MM-DD format.");
    }
    const date = new Date(`${value}T23:59:59.999Z`);
    if (!(date.getTime())) {
        throw new ConflictException("Invalid due_date. Please provide a valid date.");
    }
    return date;
})));
export const projectUserIds = nullish(array(number()));
