import type { InferOutput } from "valibot";

import {
  array,
  minLength,
  nonEmpty,
  nullish,
  number,
  object,
  optional,
  picklist,
  pipe,
  string,
  transform,
} from "valibot";

import {
  TASK_DESCRIPTION_INVALID,
  TASK_PROJECT_ID_INVALID,
  TASK_PROJECT_ID_MISSING,
  TASK_STATUS_INVALID,
  TASK_TITLE_INVALID,
  TASK_TITLE_MISSING,
  TASK_TITLE_TOO_SHORT,
} from "../../constants/appMessages.js";

// Allowed statuses
export const allowedTaskStatuses = [
  "NEW",
  "IN_PROGRESS",
  "COMPLETED",
  "REVIEW",
  "OVERDUE",
  "DONE",
] as const;

// Create Task Schema
export const VCreateTaskSchema = object({
  task_title: pipe(
    string(TASK_TITLE_INVALID),
    nonEmpty(TASK_TITLE_MISSING),
    transform((value) => value.trim()),
    minLength(3, TASK_TITLE_TOO_SHORT)
  ),

  description: optional(
    pipe(
      string(TASK_DESCRIPTION_INVALID),
      transform((value) => value.trim())
    )
  ),
  created_by: pipe(number()),

  project_id: pipe(
    string(TASK_PROJECT_ID_INVALID),
    nonEmpty(TASK_PROJECT_ID_MISSING),
    transform((value) => Number(value))
  ),





  task_status: pipe(
    string(TASK_STATUS_INVALID),
    transform((value) => value.trim()),
    picklist(allowedTaskStatuses, TASK_STATUS_INVALID)
  ),

  start_date: pipe(string()),

  end_date: pipe(string()),

  user_ids: optional(
    array(
      pipe(
        string("User ID must be a string"),
        transform((val) => Number(val)),
        number("User ID must be a number")
      )
    )
  ),
});

export type ValidatedCreateTask = InferOutput<typeof VCreateTaskSchema>;
