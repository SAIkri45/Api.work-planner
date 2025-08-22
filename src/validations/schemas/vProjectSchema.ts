import type { InferOutput } from "valibot";

import { array, minLength, nonEmpty, nullish, number, object, optional, picklist, pipe, pipeAsync, string, transform } from "valibot";

import { allowedProjectStatus, PROJECT_LINKS_INVALID, PROJECT_LINKS_MISSING, PROJECT_LINKS_TOO_SHORT, PROJECT_LOGO_URL_MISSING, USER_TYPE_INVALID } from "../../constants/appMessages.js";
import ConflictException from "../../exceptions/conflictException.js";
import { ProjectDescription, projectTile } from "./projectCommonValidatiors.js";

// Create Legal Advisor or Advocate Schema
// export const VCreateProjectSchema = pipeAsync(
//     object({
//         title: projectTile,
//         description: ProjectDescription,
//         logo_url: optional(string(PROJECT_LOGO_URL_MISSING)),
//         project_links: optional(pipe(
//             string(PROJECT_LINKS_INVALID),
//             nonEmpty(PROJECT_LINKS_MISSING),
//             transform(value => value.trim()),
//             minLength(10, PROJECT_LINKS_TOO_SHORT),
//         )),
//         created_by: pipe(number()),
//         updated_by: nullish(number()),
//         project_status: optional(
//             pipe(
//                 string(USER_TYPE_INVALID),
//                 nonEmpty(USER_TYPE_INVALID),
//                 transform(value => value.trim().toUpperCase()),
//                 picklist(allowedProjectStatus, USER_TYPE_INVALID),
//             ),
//         ),
//         start_date: pipe(
//             string(),
//             transform((value) => {
//                 // simple YYYY-MM-DD format validation
//                 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//                     throw new ConflictException("Invalid start_date format");
//                 }
//                 return value; // keep as string
//             }),
//         ),

//         due_date: optional(
//             pipe(
//                 string(),
//                 transform((value) => {
//                     if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//                         throw new ConflictException("Invalid due_date format");
//                     }
//                     return value; // keep as string
//                 }),
//             ),
//         ),
//         user_ids: nullish(array(number())),
//     }),

// );

export const VCreateProjectSchema = pipeAsync(
  object({
    title: projectTile,
    description: ProjectDescription,
    logo_url: optional(string(PROJECT_LOGO_URL_MISSING)),
    project_links: optional(pipe(
      string(PROJECT_LINKS_INVALID),
      nonEmpty(PROJECT_LINKS_MISSING),
      transform(value => value.trim()),
      minLength(10, PROJECT_LINKS_TOO_SHORT),
    )),
    created_by: pipe(number()),
    updated_by: nullish(number()),
    project_status: optional(
      pipe(
        string(USER_TYPE_INVALID),
        nonEmpty(USER_TYPE_INVALID),
        transform(value => value.trim().toUpperCase()),
        picklist(allowedProjectStatus, USER_TYPE_INVALID),
      ),
    ),

    // Simple YYYY-MM-DD only validation
    start_date: pipe(
      string("start_date is required"),
      transform((value) => {
        // Strict YYYY-MM-DD format validation
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          throw new ConflictException("Invalid start_date format. Use YYYY-MM-DD format.");
        }

        const date = new Date(`${value}T00:00:00.000Z`);

        if (!(date.getTime())) {
          throw new ConflictException("Invalid start_date. Please provide a valid date.");
        }

        return date;
      }),
    ),

    due_date: optional(
      pipe(
        string("due_date must be a string"),
        transform((value) => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new ConflictException("Invalid due_date format. Use YYYY-MM-DD format.");
          }

          const date = new Date(`${value}T23:59:59.999Z`);

          if (!(date.getTime())) {
            throw new ConflictException("Invalid due_date. Please provide a valid date.");
          }

          return date;
        }),
      ),
    ),

    user_ids: nullish(array(number())),
  }),

  transform((data) => {
    // Cross-field validation
    if (data.due_date && data.start_date) {
      if (data.due_date <= data.start_date) {
        throw new ConflictException("due_date must be after start_date");
      }
    }

    return data;
  }),
);

// Types
export type ValidatedCreateProject = InferOutput<typeof VCreateProjectSchema>;
