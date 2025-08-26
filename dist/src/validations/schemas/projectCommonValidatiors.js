import { array, date, isoDate, maxLength, minLength, nonEmpty, nullish, number, optional, picklist, pipe, string, transform } from "valibot";
import { allowedProjectStatus, DATE_INVALID, DATE_IS_INVALID, DATE_REQUIRED, PROJECT_DESCRIPTION_REQUIRED, PROJECT_DESCRIPTION_TOO_SHORT, PROJECT_NAME_TOO_SHORT, PROJECT_REQUIRED, PROJECT_STATUS_REQUIRED } from "../../constants/appMessages.js";
export const projectTile = pipe(string(PROJECT_REQUIRED), nonEmpty(PROJECT_REQUIRED), transform(value => value.trim().toLocaleLowerCase()), minLength(3, PROJECT_NAME_TOO_SHORT), maxLength(20, PROJECT_NAME_TOO_SHORT));
export const ProjectDescription = pipe(string(PROJECT_DESCRIPTION_REQUIRED), nonEmpty(PROJECT_DESCRIPTION_REQUIRED), transform(value => value.trim()), minLength(3, PROJECT_DESCRIPTION_TOO_SHORT));
export const projectStatus = optional(pipe(string(PROJECT_STATUS_REQUIRED), nonEmpty(PROJECT_STATUS_REQUIRED), transform(value => value.trim().toUpperCase()), picklist(allowedProjectStatus, PROJECT_STATUS_REQUIRED)));
export const projectStartDate = pipe(string(DATE_REQUIRED), isoDate(DATE_IS_INVALID), transform(str => new Date(str)), date(DATE_INVALID));
export const projectDueDate = optional(pipe(string(DATE_REQUIRED), isoDate(DATE_IS_INVALID), transform(str => new Date(str)), date(DATE_INVALID)));
export const projectUserIds = nullish(array(number()));
export const projectUserIdsRequired = pipe(array(number()), minLength(1, "At least one user ID is required"));
