import type { InferOutput } from "valibot";

import { array, minLength, nonEmpty, number, object, optional, pipe, string, transform } from "valibot";

import { taskDescription, taskEndDate, taskStartDate, taskStatus } from "./taskCommonValidations.js";

export const VCreateTaskAssigneeSchema = object({

  user_ids: array(pipe(
    number("User ID must be a number"),
    transform(val => Number(val)),
  )),

  task_title: pipe(
    string("Task title must be a string"),
    nonEmpty("Task title is required"),
    transform(value => value.trim()),
    minLength(3, "Task title must be at least 3 characters"),
  ),

  created_by: optional(pipe(
    number("Created by must be a number"),
    transform(val => Number(val)),
  )),

  updated_by: optional(
    pipe(
      number("Updated by must be a number"),
      transform(val => Number(val)),
    ),
  ),
  task_status: taskStatus,

  start_date: taskStartDate,

  end_date: taskEndDate,

  description: taskDescription,

});

export type ValidatedCreateTaskAssignee = InferOutput<typeof VCreateTaskAssigneeSchema>;
