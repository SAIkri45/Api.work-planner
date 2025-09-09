import type { Project } from "../db/schema/projects.js";
import type { SlackToken } from "../db/schema/slackTokens.js";
import type { TaskAssignees } from "../db/schema/taskAssignees.js";
import type { UserProjects } from "../db/schema/userProjects.js";
import type { User } from "../db/schema/users.js";
import type { Task } from "../db/schema/tasks.js";
import type { ValidatedCreateProject, ValidatedUpdateProject } from "../validations/schemas/vProjectSchema.js";
import { ValidatedCreateTaskAssignee } from "../validations/schemas/vTaskAssigneesSchema.js";
import { ValidatedCreateTask } from "../validations/schemas/vTaskSchema.js";
import type { ValidatedCreateUserOrAdmin } from "../validations/schemas/vUserSchema.js";
import { ValidatedSignIn, ValidatedSignUpOrSignIn, ValidatedSignUpOrSignInVerification } from "../validations/schemas/signInSignUpValidationSchema.js";

export type ValidatedRequest = ValidatedCreateUserOrAdmin | ValidatedCreateProject | ValidatedUpdateProject | ValidatedCreateTask | ValidatedCreateTaskAssignee
| ValidatedSignUpOrSignIn | ValidatedSignUpOrSignInVerification | ValidatedSignIn 
export type AppActivity = UserActivity | CreateProjectActivity | CreateTaskAssigneeActivity  | AuthActivity
export type AuthActivity = "signup-or-signin" | "signup-or-signin-verify" | "signin" | "signin-verify"
export type UserActivity = "create-user" | "update-user";
export type CreateProjectActivity = "create-project" | "update-project";
export type CreateTaskAssigneeActivity = "create-task" | "create-task-assignee" | "update-task-assignee";

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
