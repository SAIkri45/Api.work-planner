import type { Project } from "../db/schema/projects.js";
import type { SlackToken } from "../db/schema/slackTokens.js";
import { Tasks } from "../db/schema/tasks.js";
import type { TaskAssignees } from "../db/schema/taskAssignees.js";
import type { UserProjects } from "../db/schema/userProjects.js";
import type { User } from "../db/schema/users.js";
import type { ValidatedCreateProject, ValidatedUpdateProject } from "../validations/schemas/vProjectSchema.js";
import type { ValidatedCreateUserOrAdmin } from "../validations/schemas/vUserSchema.js";
import type { ValidatedCreateTaskAssignee} from "../validations/schemas/vTaskAssigneesSchema";
import { ValidatedCreateTask } from "../validations/schemas/vTaskSchema.js";

export type ValidatedRequest = ValidatedCreateUserOrAdmin | ValidatedCreateProject | ValidatedUpdateProject | ValidatedCreateTask;
export type AppActivity = UserActivity | CreateProjectActivity | CreateTaskAssigneeActivity;
export type UserActivity = "create-user" | "update-user";
export type CreateProjectActivity = "create-project" | "update-project";
export type CreateTaskAssigneeActivity = "create-task-assignee" | "update-task-assignee"| "create-task";

export type AppRespData = | User
  | User[]
  | SlackToken
  | SlackToken[]
  | Project
  | Project[]
  | UserProjects
  | UserProjects[]
  | TaskAssignees
  | TaskAssignees[];

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
