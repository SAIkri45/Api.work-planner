import type { InferOutput } from "valibot";

import { minLength, nonEmpty, nullish, number, object, optional, pipe, pipeAsync, string, transform } from "valibot";

import { PROJECT_LINKS_INVALID, PROJECT_LINKS_MISSING, PROJECT_LINKS_TOO_SHORT, PROJECT_LOGO_URL_MISSING } from "../../constants/appMessages.js";
import ConflictException from "../../exceptions/conflictException.js";
import { ProjectDescription, projectDueDate, projectStartDate, projectStatus, projectTile, projectUserIds, projectUserIdsRequired } from "./projectCommonValidatiors.js";

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
    project_status: projectStatus,

    start_date: projectStartDate,

    due_date: projectDueDate,

    user_ids: projectUserIds,
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

export const VUpdateProjectSchema = pipeAsync(
  object({
    title: projectTile,
    description: ProjectDescription,
    logo_url: optional(string(PROJECT_LOGO_URL_MISSING)),
    updated_by: pipe(number()),
    project_status: projectStatus,
    start_date: projectStartDate,
    due_date: projectDueDate,
    // user_ids: projectUserIds,
    // users_to_remove: optional(array(number())),
    id: optional(pipe(number())),
  }),
);

export const VAddUsersToProjectSchema = pipeAsync(
  object({
    project_id: pipe(number()),
    user_ids: projectUserIdsRequired,
  }),
);

export const VRemoveUsersFromProjectSchema = pipeAsync(
  object({
    user_ids: projectUserIdsRequired,
  }),
);

// Types
export type ValidatedCreateProject = InferOutput<typeof VCreateProjectSchema>;
export type ValidatedUpdateProject = InferOutput<typeof VUpdateProjectSchema>;
export type ValidatedAddUsersToProject = InferOutput<typeof VAddUsersToProjectSchema>;
export type ValidatedRemoveUsersFromProject = InferOutput<typeof VRemoveUsersFromProjectSchema>;
