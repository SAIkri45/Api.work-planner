import type { Context } from "hono";

import { createMiddleware } from "hono/factory";

import { getUserDetailsFromToken } from "../utils/jwtUtils.js";

const isAuthorized = createMiddleware(async (c: Context, next) => {
  const userDetails = await getUserDetailsFromToken(c);
  c.set("user_payload", userDetails);
  await next();
});
export default isAuthorized;
