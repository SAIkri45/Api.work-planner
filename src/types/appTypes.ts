import { User } from "../db/schema/user.js";
import type { Group } from "../db/schema/group";
import type { ValidatedCreateGroup } from "../validations/schemas/vGroupSchema";
import { ValidatedCreateUserOrAdmin } from "../validations/schemas/vUserSchema.js";

export type ValidatedRequest = ValidatedCreateGroup | ValidatedCreateUserOrAdmin;
export type AppActivity = GroupActivity | UserActivity;
export type GroupActivity = "add-group" | "update-group";
export type UserActivity = "create-user" | "update-user";

export type AppRespData = | Group
  | Group[]
  | User
  | User[];

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
