import { createMiddleware } from "hono/factory";
import { getByUserId } from "../services/db/slackOAuthService.js";
let slack_user_id;
export async function getSlackId(slackId) {
    return slack_user_id = slackId;
}
export const isEmployeAuthorized = createMiddleware(async (c, next) => {
    const userDetails = await getByUserId(slack_user_id);
    c.set("user_payload", userDetails);
    await next();
});
