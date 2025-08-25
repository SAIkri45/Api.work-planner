import type { Context } from "hono";

import NotFoundException from "../exceptions/notFoundException.js";
import { getOAuthCode } from "../helpers/oAuthHelper.js";
import { getByUserId } from "../services/db/slackOAuthService.js";

// Middleware to set DB user in context payload after Slack OAuth
export async function isEmployeeAuthorized(c: Context, next: () => Promise<void> | void) {
  const code = c.req.query("code");

  if (!code) {
    throw new NotFoundException("code not found in query parameters");
  }

  const { userData } = await getOAuthCode(code);

  const userDetails = await getByUserId(userData.slack_id);

  if (userDetails) {
    // if (userDetails.user_type !== "EMPLOYEE") {
    //     throw new NotFoundException("User is not an EMPLOYEE");
    // }
    c.set("user", userDetails);
  }
  else {
    c.set("user", null);
  }

  await next();
}
