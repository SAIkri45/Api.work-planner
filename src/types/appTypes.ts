import type { Project } from "../db/schema/projects.js";
import type { SlackToken } from "../db/schema/slackTokens.js";
import type { UserProjects } from "../db/schema/userProjects.js";
import type { User } from "../db/schema/users.js";
import type { ValidatedAddUsersToProject, ValidatedCreateProject, ValidatedRemoveUsersFromProject, ValidatedUpdateProject } from "../validations/schemas/vProjectSchema.js";
import type { ValidatedCreateUserOrAdmin } from "../validations/schemas/vUserSchema.js";
import type { PaginationInfo } from "./dbTypes.js";

export type ValidatedRequest = ValidatedCreateUserOrAdmin | ValidatedCreateProject | ValidatedUpdateProject | ValidatedAddUsersToProject | ValidatedRemoveUsersFromProject;
export type AppActivity = UserActivity | CreateProjectActivity;
export type UserActivity = "create-user" | "update-user";
export type CreateProjectActivity = "create-project" | "update-project" | "add-users-to-project" | "remove-users-from-project";

export type AppRespData = | User
  | User[]
  | SlackToken
  | SlackToken[]
  | Project
  | Project[]
  | UserProjects
  | UserProjects[];

export interface JWTUserPayload {
  sub: number;
  iat: number;
}
export type ActionType = string;

export interface PhoneOtpData {
  otp: string;
  expires_at: Date;
  phone: string | null;
}

export interface SuccessResp {
  status: number;
  success: true;
  message: string;
  data?: AppRespData;
}

export interface FileData {
  target_url: string;
  file_key: string;
}

export interface DownloadFile {
  download_url: string;
}

export interface RefreshedTokenData {
  access_token: string;
  expires_at: number;
  refresh_token: string;
}

export interface TaskResponse {
  id: number;
  task_title: string;
  task_status: "NEW" | "IN_PROGRESS" | "COMPLETED" | "REVIEW" | "OVERDUE" | "DONE" | null;
  start_date: Date | null;
  end_date: Date | null;
}

export interface ProjectTasksResp {
  pagination: PaginationInfo;
  records: TaskResponse[];
}
