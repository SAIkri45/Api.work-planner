import type { Project } from "../db/schema/projects.js";
import type { SlackToken } from "../db/schema/slackTokens.js";
import type { TaskAssignees } from "../db/schema/taskAssignees.js";
import type { Task } from "../db/schema/tasks.js";
import type { UserProjects } from "../db/schema/userProjects.js";
import type { User } from "../db/schema/users.js";
import type { ValidatedSignIn, ValidatedSignUpOrSignIn, ValidatedSignUpOrSignInVerification } from "../validations/schemas/signInSignUpValidationSchema.js";
import type { ValidatedAddUsersToProject, ValidatedCreateProject, ValidatedRemoveUsersFromProject, ValidatedUpdateProject, ValidatedUpdateProjectStatus } from "../validations/schemas/vProjectSchema.js";
import type { ValidatedCreateTaskAssignee } from "../validations/schemas/vTaskAssigneesSchema.js";
import type { ValidatedCreateTask, ValidatedUpdateTask } from "../validations/schemas/vTaskSchema.js";
import type { ValidatedCreateUserOrAdmin, ValidatedUpdateUser } from "../validations/schemas/vUserSchema.js";
import type { PaginationInfo } from "./dbTypes";

export type ValidatedRequest = ValidatedCreateUserOrAdmin | ValidatedCreateProject | ValidatedUpdateProject | ValidatedCreateTask | ValidatedCreateTaskAssignee | ValidatedUpdateUser | ValidatedUpdateProjectStatus | ValidatedAddUsersToProject | ValidatedSignUpOrSignIn | ValidatedSignUpOrSignInVerification | ValidatedSignIn | ValidatedRemoveUsersFromProject | ValidatedUpdateTask;
export type AppActivity = UserActivity | CreateProjectActivity | CreateTaskAssigneeActivity | AuthActivity;
export type AuthActivity = "signup-or-signin" | "signup-or-signin-verify" | "signin" | "signin-verify";
export type UserActivity = "create-user" | "update-user";
export type CreateProjectActivity = "create-project" | "update-project" | "add-users-to-project" | "remove-users-from-project" | "update-project-status";
export type CreateTaskAssigneeActivity = "create-task" | "create-task-assignee" | "update-task";
export interface EmailOtpData {
  action: string;
  otp: string;
  expires_at: Date;
  email: string | null;
}
export interface PhoneOtpData {
  action: string;
  otp: string;
  expires_at: Date;
  phone: string | null;
}
export type OTPData = EmailOtpData | PhoneOtpData;

export type AppRespData = | User
  | User[]
  | SlackToken
  | SlackToken[]
  | Project
  | Project[]
  | UserProjects
  | UserProjects[]
  | TaskAssignees
  | TaskAssignees[]
  | Task
  | Task[];

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

export interface ErrorResp {
  status: number;
  success: false;
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
  start_date: string | null;
  end_date: string | null;
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

export interface TaskWithProject {
  id: number;
  task_title: string;
  description: string;
  task_status: string;
  start_date: string;
  end_date: string;
  project?: {
    title: string;
  };
}
