import type { InferOutput } from "valibot";

import { maxLength, minLength, nonEmpty, number, object, pipe, pipeAsync, rawTransformAsync, string, transform } from "valibot";

import type { Group } from "../../db/schema/group.js";

import { GROUP_ALREADY_EXISTS, GROUP_NOT_FOUND_ID, TITLE_MAX_LENGTH, TITLE_MIN_LENGTH, TITLE_NAME_INVALID, TITLE_NAME_REQUIRED } from "../../constants/appMessages.js";
import { groups } from "../../db/schema/group.js";
import { getRecordById, getSingleRecordByAColumnValue } from "../../services/db/baseDbService.js";
import { groupTitleExists } from "../customValidations.js";
import { prepareValibotIssue } from "../prepareValibotIssue.js";

export const VGroupSchema = pipeAsync(
  object({
    title: pipe(
      string(TITLE_NAME_INVALID),
      nonEmpty(TITLE_NAME_REQUIRED),
      transform(value => value.trim()),
      minLength(3, TITLE_MIN_LENGTH),
      maxLength(20, TITLE_MAX_LENGTH),
    ),

  }),
  rawTransformAsync(async ({ dataset, addIssue }) => {
    if (dataset.value.title) {
      const { title } = dataset.value;
      if (await groupTitleExists(title)) {
        prepareValibotIssue(dataset, addIssue, "title", title, GROUP_ALREADY_EXISTS);
      }
    }
    return dataset.value;
  }),

);

// update schema
export const VGroupUpdateSchema = pipeAsync(
  object({
    title: pipe(
      string(TITLE_NAME_INVALID),
      nonEmpty(TITLE_NAME_REQUIRED),
      transform(value => value.trim()),
      minLength(3, TITLE_MIN_LENGTH),
      maxLength(20, TITLE_MAX_LENGTH),
    ),
    id: pipe(number("ID is missing")),

  }),

  // Check if the record exists and is not deleted
  rawTransformAsync(async ({ dataset, addIssue }) => {
    const { id } = dataset.value;

    const group = await getRecordById<Group>(groups, id);
    if (!group || group.deleted_at !== null) {
      prepareValibotIssue(dataset, addIssue, "id", id, GROUP_NOT_FOUND_ID);
    }
    return dataset.value;
  }),

  rawTransformAsync(async ({ dataset, addIssue }) => {
    const { title, id } = dataset.value;

    if (title && id !== null) {
      const existingGroup = await getSingleRecordByAColumnValue<Group>(groups, "title", title);

      // If title exists and belongs to a different record
      if (existingGroup && existingGroup.id !== id) {
        prepareValibotIssue(dataset, addIssue, "title", title, GROUP_ALREADY_EXISTS);
      }
    }

    return dataset.value;
  }),
);

export type ValidatedCreateGroup = InferOutput<typeof VGroupSchema>;
export type ValidatedUpdateGroup = InferOutput<typeof VGroupUpdateSchema>;
