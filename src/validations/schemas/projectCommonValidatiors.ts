import { minLength, nonEmpty, pipe, string, transform } from "valibot";

import { PROJECT_DESCRIPTION_REQUIRED, PROJECT_DESCRIPTION_TOO_SHORT, PROJECT_NAME_TOO_SHORT, PROJECT_REQUIRED } from "../../constants/appMessages.js";

export const projectTile = pipe(
  string(PROJECT_REQUIRED),
  nonEmpty(PROJECT_REQUIRED),
  transform(value => value.trim().toLocaleLowerCase()),
  minLength(3, PROJECT_NAME_TOO_SHORT),
);

export const ProjectDescription = pipe(
  string(PROJECT_DESCRIPTION_REQUIRED),
  nonEmpty(PROJECT_DESCRIPTION_REQUIRED),
  transform(value => value.trim()),
  minLength(3, PROJECT_DESCRIPTION_TOO_SHORT),
);
