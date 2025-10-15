import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { ErrorResp, SuccessResp } from "../types/appTypes";

export function sendSuccessResp(c: Context, status: ContentfulStatusCode, message: string, data?: any) {
  const resp: SuccessResp = {
    status,
    success: true,
    message,
  };
  if (data !== undefined) {
    resp.data = data;
  }

  return c.json(resp, status);
}

export function sendResponse(c: Context, p0: number, p1: boolean, p2: string, status: ContentfulStatusCode, message: string) {
  return c.json({ status, success: false, message }, status);
}

export function sendErrorResp(c: Context, status: ContentfulStatusCode, message: string, data?: any) {
  const resp: ErrorResp = {
    status,
    success: false,
    message,
  };
  if (data) {
    resp.data = data;
  }

  return c.json(resp, status);
}
