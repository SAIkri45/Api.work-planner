import type { Context } from "hono";

import { createMiddleware } from "hono/factory";

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

// const isManagerOrAdmin = createMiddleware(async (c: Context, next) => {
//   const userDetails = await getUserDetailsFromToken(c);
//   if (userDetails.user_type === "ADMIN" || userDetails.user_type === "MANAGER") {
//     c.set("user_payload", userDetails);
//     await next();
//   }
//   else {
//     return sendSuccessResp(c, 401, "Access denied to create project");
//   }
// });

const isManagerOrAdmin = createMiddleware(async (c: Context, next) => {
  try {
    const userDetails = await getUserDetailsFromToken(c);

    if (userDetails.user_type === "ADMIN" || userDetails.user_type === "MANAGER") {
      c.set("user_payload", userDetails);
      await next();
    }
    else {
      // Return proper error response
      return c.json({
        success: false,
        message: "Access denied. Only managers and admins are allowed to perform this action.",
        error: "INSUFFICIENT_PERMISSIONS",
        statusCode: 403,
      }, 403);
    }
  }
  catch (error) {
    // Handle token validation errors
    return c.json({
      success: false,
      message: "Authentication failed. Please login again.",
      error: "AUTHENTICATION_FAILED",
      statusCode: 401,
    }, 401);
  }
});

export { isAuthorized, isManagerOrAdmin, isOptionalAuthorized };
