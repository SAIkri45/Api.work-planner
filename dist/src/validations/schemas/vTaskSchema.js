import { array, isoDate, minLength, nonEmpty, number, object, optional, pipe, pipeAsync, string, transform } from "valibot";
import { DATE_REQUIRED, DUE_DATE_REQUIRED, TASK_DESCRIPTION_INVALID, TASK_TITLE_INVALID, TASK_TITLE_MISSING, TASK_TITLE_TOO_SHORT } from "../../constants/appMessages.js";
import ConflictException from "../../exceptions/conflictException.js";
// Allowed statuses
export const allowedTaskStatuses = ["NEW", "IN_PROGRESS", "COMPLETED", "REVIEW", "OVERDUE", "DONE"];
// Create Task Schema
export const VCreateTaskSchema = pipeAsync(object({
    task_title: pipe(string(TASK_TITLE_INVALID), nonEmpty(TASK_TITLE_MISSING), transform(value => value.trim().toLocaleLowerCase()), minLength(3, TASK_TITLE_TOO_SHORT)),
    description: optional(pipe(string(TASK_DESCRIPTION_INVALID), transform(value => value.trim()))),
    // created_by: pipe(number()),
    project_id: pipe(number("Project id is required")),
    start_date: pipe(string(DATE_REQUIRED), isoDate(DATE_REQUIRED), transform(str => new Date(str))),
    end_date: pipe(string(DUE_DATE_REQUIRED), isoDate(DUE_DATE_REQUIRED), transform(str => new Date(str))),
    assigned_users: optional(array(number())),
}), transform((data) => {
    // Cross-field validation
    if (data.end_date && data.start_date) {
        if (data.end_date <= data.start_date) {
            throw new ConflictException("End Date must be after Start Date");
        }
    }
    return data;
}));
