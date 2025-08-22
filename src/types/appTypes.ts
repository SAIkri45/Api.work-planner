import type { Project } from "../db/schema/projects.js";
import type { SlackToken } from "../db/schema/slackTokens.js";
import type { User } from "../db/schema/users.js";
import type { ValidatedCreateProject } from "../validations/schemas/vProjectSchema.js";
import type { ValidatedCreateUserOrAdmin } from "../validations/schemas/vUserSchema.js";

export type ValidatedRequest = ValidatedCreateUserOrAdmin | ValidatedCreateProject;
export type AppActivity = UserActivity | CreateProjectActivity;
export type UserActivity = "create-user" | "update-user";
export type CreateProjectActivity = "create-project" | "update-project";

export type AppRespData = | User
  | User[]
  | SlackToken
  | SlackToken[]
  | Project
  | Project[];

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
