import { array, minLength, nonEmpty, number, object, optional, pipe, string, transform } from "valibot";
import { TASK_DESCRIPTION_INVALID, TASK_TITLE_INVALID, TASK_TITLE_MISSING, TASK_TITLE_TOO_SHORT } from "../../constants/appMessages.js";
// Allowed statuses
export const allowedTaskStatuses = ["NEW", "IN_PROGRESS", "COMPLETED", "REVIEW", "OVERDUE", "DONE"];
// Create Task Schema
export const VCreateTaskSchema = object({
    task_title: pipe(string(TASK_TITLE_INVALID), nonEmpty(TASK_TITLE_MISSING), transform(value => value.trim()), minLength(3, TASK_TITLE_TOO_SHORT)),
    description: optional(pipe(string(TASK_DESCRIPTION_INVALID), transform(value => value.trim()))),
    created_by: pipe(number()),
    project_id: pipe(number("Project id is required")),
    // task_status: pipe(
    //   string(TASK_STATUS_INVALID),
    //   transform(value => value.trim()),
    //   picklist(allowedTaskStatuses, TASK_STATUS_INVALID),
    // ),
    start_date: pipe(string()),
    end_date: pipe(string()),
    user_ids: optional(array(number("User ID must be a number"))),
});
