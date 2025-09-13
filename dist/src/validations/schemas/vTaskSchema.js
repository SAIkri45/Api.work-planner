import { array, minLength, nonEmpty, number, object, optional, pipe, pipeAsync, string, transform } from "valibot";
import { TASK_DESCRIPTION_INVALID, TASK_TITLE_INVALID, TASK_TITLE_MIN_LENGTH, TASK_TITLE_MISSING, TASK_TITLE_TOO_SHORT } from "../../constants/appMessages.js";
import ConflictException from "../../exceptions/conflictException.js";
import { taskDueDate, taskStartdate } from "./taskCommonValidations.js";
// Allowed statuses
export const allowedTaskStatuses = ["NEW", "IN_PROGRESS", "COMPLETED", "REVIEW", "OVERDUE", "DONE"];
// Create Task Schema
export const VCreateTaskSchema = pipeAsync(object({
    task_title: pipe(string(TASK_TITLE_INVALID), nonEmpty(TASK_TITLE_MISSING), transform(value => value.trim().toLocaleLowerCase()), minLength(3, TASK_TITLE_TOO_SHORT)),
    description: pipe(string(TASK_DESCRIPTION_INVALID), nonEmpty(TASK_DESCRIPTION_INVALID), transform(value => value.trim()), minLength(3, TASK_TITLE_MIN_LENGTH)),
    // created_by: pipe(number()),
    project_id: pipe(number("Project id is required")),
    start_date: taskStartdate,
    end_date: taskDueDate,
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
