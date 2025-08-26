import type { InferOutput } from "valibot";
import {object,string,number,transform,nonEmpty,pipe,optional,minLength,} from "valibot";

export const VCreateTaskAssigneeSchema = object({
  task_id: pipe(
    number("Task ID must be a number"),
    transform((val) => Number(val)),
  ),

  user_id: pipe(
    number("User ID must be a number"),
    transform((val) => Number(val)),
  ),

  task_title: pipe(
    string("Task title must be a string"),
    nonEmpty("Task title is required"),
    transform((value) => value.trim()),
    minLength(3, "Task title must be at least 3 characters"),
  ),

  created_by: pipe(
    number("Created by must be a number"),
    transform((val) => Number(val)),
  ),

  updated_by: optional(
    pipe(
      number("Updated by must be a number"),
      transform((val) => Number(val)),
    ),
  ),
});


export type ValidatedCreateTaskAssignee = InferOutput<typeof VCreateTaskAssigneeSchema>;
