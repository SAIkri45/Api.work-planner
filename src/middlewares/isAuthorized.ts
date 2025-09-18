import type { Context } from "hono";

import { createMiddleware } from "hono/factory";

import ConflictException from "../exceptions/conflictException.js";
import { getUserDetailsFromToken } from "../utils/jwtUtils.js";

const isAuthorized = createMiddleware(async (c: Context, next) => {
  const userDetails = await getUserDetailsFromToken(c);
  c.set("user_payload", userDetails);
  await next();
});

const isManagerOrAdmin = createMiddleware(async (c: Context, next) => {
  try {
    const userDetails = await getUserDetailsFromToken(c);

    if (userDetails.user_type === "ADMIN" || userDetails.user_type === "MANAGER") {
      c.set("user_payload", userDetails);
      await next();
    }
    else {
      throw new ConflictException("Permission denied. You don’t have access");
    }
  }
  catch (error) {
    throw error;
  }
});

export { isAuthorized, isManagerOrAdmin };
