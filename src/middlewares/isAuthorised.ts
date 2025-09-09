import type { Context } from "hono";
import { getUserDetailsFromToken } from "../utils/jwtUtils.js";
import { createMiddleware } from "hono/factory";
const isAuthorized = createMiddleware(async (c: Context, next) => {
  const userDetails = await getUserDetailsFromToken(c);
  c.set("user_payload", userDetails);
  await next();
});
export default isAuthorized;