import type { Group } from "../db/schema/group";
import type { ValidatedCreateGroup } from "../validations/schemas/vGroupSchema";

export type ValidatedRequest = ValidatedCreateGroup;
export type AppActivity = GroupActivity;
export type GroupActivity = "add-group" | "update-group";

export type AppRespData = | Group | Group[];

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
