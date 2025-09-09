import type { Context } from "hono";

import { createMiddleware } from "hono/factory";

import UnauthorizedException from "../exceptions/unauthorizedException.js";
import { getUserDetailsFromToken } from "../utils/jwtUtils.js";

const isAuthorized = createMiddleware(async (c: Context, next) => {
  const userDetails = await getUserDetailsFromToken(c);
  c.set("user_payload", userDetails);
  await next();
});

const isOptionalAuthorized = createMiddleware(async (c: Context, next) => {
  const isPublic = c.req.query("is_public") || "false";
  if (isPublic && isPublic === "true") {
    await next();
  }
  else {
    const userDetails = await getUserDetailsFromToken(c);
    c.set("user_payload", userDetails);
    await next();
  }
});

const isManagerOrAdmin = createMiddleware(async (c: Context, next) => {
  const userDetails = await getUserDetailsFromToken(c);
  if (userDetails.user_type === "ADMIN" || userDetails.user_type === "MANAGER") {
    c.set("user_payload", userDetails);
    await next();
  }
  else {
    throw new UnauthorizedException("Access denied. Only managers and admins allowed.");
  }
});

export { isAuthorized, isManagerOrAdmin, isOptionalAuthorized };
