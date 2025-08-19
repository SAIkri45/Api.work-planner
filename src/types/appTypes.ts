import type { SlackToken } from "../db/schema/slackTokens.js";
import type { User } from "../db/schema/user.js";
import type { ValidatedCreateUserOrAdmin } from "../validations/schemas/vUserSchema.js";

export type ValidatedRequest = ValidatedCreateUserOrAdmin;
export type AppActivity = UserActivity;
export type UserActivity = "create-user" | "update-user";

export type AppRespData
  = | User
    | User[]
    | SlackToken
    | SlackToken[];

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
