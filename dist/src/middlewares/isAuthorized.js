import { createMiddleware } from "hono/factory";
import UnauthorizedException from "../exceptions/unauthorizedException.js";
import { getUserDetailsFromToken } from "../utils/jwtUtils.js";
const isAuthorized = createMiddleware(async (c, next) => {
    const userDetails = await getUserDetailsFromToken(c);
    c.set("user_payload", userDetails);
    await next();
});
const isOptionalAuthorized = createMiddleware(async (c, next) => {
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
const isManagerOrAdmin = createMiddleware(async (c, next) => {
    try {
        const userDetails = await getUserDetailsFromToken(c);
        if (userDetails.user_type === "ADMIN" || userDetails.user_type === "MANAGER") {
            c.set("user_payload", userDetails);
            await next();
        }
        else {
            // return sendErrorResp(c, 403, "Access denied");
            throw new UnauthorizedException("Access denied");
        }
    }
    catch (error) {
        throw error;
    }
});
export { isAuthorized, isManagerOrAdmin, isOptionalAuthorized };
