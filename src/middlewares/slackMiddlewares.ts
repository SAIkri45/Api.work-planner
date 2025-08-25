import type { Context } from "hono";

import { createMiddleware } from "hono/factory";

import { getByUserId } from "../services/db/slackOAuthService.js";

let slack_user_id: string;

export async function getSlackId(slackId: string) {
  return slack_user_id = slackId;
}

export const isEmployeAuthorized = createMiddleware(async (c: Context, next) => {
  const userDetails = await getByUserId(slack_user_id);
  c.set("userDetails", userDetails);
  await next();
});
