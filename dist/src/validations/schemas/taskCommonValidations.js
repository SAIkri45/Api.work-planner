import { array, isoDate, minLength, nonEmpty, nullish, number, optional, picklist, pipe, string, transform } from "valibot";
import { DATE_REQUIRED, DUE_DATE_REQUIRED } from "../../constants/appMessages.js";
import ConflictException from "../../exceptions/conflictException.js";
// Allowed task statuses (match your pgEnum)
export const allowedTaskStatuses = [
    "NEW",
    "IN_PROGRESS",
    "COMPLETED",
    "REVIEW",
    "OVERDUE",
    "DONE",
];
export const taskTitle = pipe(string("Task title is required"), nonEmpty("Task title is required"), transform(value => value.trim()), minLength(3, "Task title must be at least 3 characters"));
export const taskDescription = optional(pipe(string("Description must be a string"), transform(value => value.trim())));
export const taskStatus = optional(pipe(string("Task status is required"), nonEmpty("Task status is required"), transform(value => value.trim().toUpperCase()), picklist(allowedTaskStatuses, "Invalid task status")));
export const taskStartDate = optional(pipe(string("start_date is required"), transform((value) => {
    // Strict ISO or YYYY-MM-DD format validation
    if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3}Z)?)?)?$/.test(value)) {
        throw new ConflictException("Invalid start_date format. Use YYYY-MM-DD or full ISO string.");
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new ConflictException("Invalid start_date. Please provide a valid date.");
    }
    return date;
})));
export const taskEndDate = optional(pipe(string("end_date must be a string"), transform((value) => {
    if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3}Z)?)?)?$/.test(value)) {
        throw new ConflictException("Invalid end_date format. Use YYYY-MM-DD or full ISO string.");
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new ConflictException("Invalid end_date. Please provide a valid date.");
    }
    return date;
})));
export const taskProjectId = pipe(number("Project ID is required"), transform(val => Number(val)));
export const taskCreatedBy = pipe(number("Created by is required"), transform(val => Number(val)));
export const taskUpdatedBy = optional(pipe(number("Updated by must be a number"), transform(val => Number(val))));
export const taskUserIds = nullish(array(number()));
export const taskStartdate = pipe(string(DATE_REQUIRED), isoDate(DATE_REQUIRED), transform(str => new Date(str)));
export const taskDueDate = pipe(string(DUE_DATE_REQUIRED), isoDate(DUE_DATE_REQUIRED), transform(str => new Date(str)));
