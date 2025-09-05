import type { Project } from "../db/schema/projects.js";
import type { SlackToken } from "../db/schema/slackTokens.js";
import type { UserProjects } from "../db/schema/userProjects.js";
import type { User } from "../db/schema/users.js";
import type { ValidatedAddUsersToProject, ValidatedCreateProject, ValidatedRemoveUsersFromProject, ValidatedUpdateProject, ValidatedUpdateProjectStatus } from "../validations/schemas/vProjectSchema.js";
import type { ValidatedCreateUserOrAdmin } from "../validations/schemas/vUserSchema.js";
import type { PaginationInfo } from "./dbTypes.js";

export type ValidatedRequest = ValidatedCreateUserOrAdmin | ValidatedCreateProject | ValidatedUpdateProject | ValidatedAddUsersToProject | ValidatedRemoveUsersFromProject | ValidatedUpdateProjectStatus;
export type AppActivity = UserActivity | CreateProjectActivity;
export type UserActivity = "create-user" | "update-user";
export type CreateProjectActivity = "create-project" | "update-project" | "add-users-to-project" | "remove-users-from-project" | "update-project-status";

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
  pagination_info: PaginationInfo;
  records: TaskResponse[];
}

export interface ProjectUser {
  user_id: number;
  display_name: string;
}

// Single project with users response
export interface ProjectWithUsersResponse {
  projectId: number;
  projectName: string;
  projectLogoUrl: string | null;
  projectStatus: string;
  project_start_date: Date | null;
  project_end_date: Date | null;
  users: ProjectUser[];
}

// Main response interface with pagination
export interface ProjectUsersResponse {
  pagination_info: PaginationInfo;
  records: ProjectWithUsersResponse[];
}

export interface UserTaskInfo {
  id: number;
  display_name: string;
  total_tasks: number;
  new_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  review_tasks: number;
  pending_tasks: number;
}

export interface UserTaskStatisticsResponse {
  pagination_info: PaginationInfo;
  records: UserTaskInfo[];
}
