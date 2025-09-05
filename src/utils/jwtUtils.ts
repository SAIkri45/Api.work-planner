import type { Context } from "node:vm";

import { isNull } from "drizzle-orm";
import { sign, verify } from "hono/jwt";
import { JwtTokenExpired, JwtTokenInvalid, JwtTokenSignatureMismatched } from "hono/utils/jwt/types";

import type { User } from "../db/schema/users.js";
import type { JWTUserPayload } from "../types/appTypes.js";

import { jwtConfig } from "../config/jwtConfig.js";
import { DEF_401, TOKEN_EXPIRED, TOKEN_INVALID, TOKEN_MISSING, TOKEN_SIG_MISMATCH, USER_NOT_FOUND } from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import UnauthorizedException from "../exceptions/unauthorizedException.js";
import { getRecordById } from "../services/db/baseDbService.js";

async function genJWTTokens(payload: JWTUserPayload) {
  const access_token_expiry = Math.floor(Date.now() / 1000) + jwtConfig.expires_in; // 30 days

  const access_token_payload = {
    ...payload,
    exp: access_token_expiry,
  };
  const refresh_token_payload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (jwtConfig.expires_in * 3), // 90 days
  };
  const access_token = await sign(access_token_payload, jwtConfig.secret);
  const refresh_token = await sign(refresh_token_payload, jwtConfig.secret);

  return {
    access_token,
    refresh_token,
  };
}

async function genJWTTokensForUser(userId: number) {
  // Create Payload
  const payload: JWTUserPayload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
  };

  // Generate Tokens
  return await genJWTTokens(payload);
}

async function verifyJWTToken(token: string) {
  try {
    const decodedPayload = await verify(token, jwtConfig.secret);

    return decodedPayload;
  }
  catch (error: any) {
    if (error instanceof JwtTokenInvalid) {
      throw new UnauthorizedException(TOKEN_INVALID);
    }

    if (error instanceof JwtTokenExpired) {
      throw new UnauthorizedException(TOKEN_EXPIRED);
    }

    if (error instanceof JwtTokenSignatureMismatched) {
      throw new UnauthorizedException(TOKEN_SIG_MISMATCH);
    }

    throw error;
  }
}

async function getUserDetailsFromToken(c: Context) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.substring(7, authHeader.length);

  if (!token) {
    throw new UnauthorizedException(TOKEN_MISSING);
  }

  const decodedPayload = await verifyJWTToken(token);

  // Check if the user is existing in the system - in case the user is removed from the system the jwt token can still be valid
  const user = await getRecordById<User>(users, decodedPayload.sub as number, isNull(users.deleted_at));
  if (!user) {
    throw new UnauthorizedException(USER_NOT_FOUND || DEF_401);
  }
  const { created_at, updated_at, ...userDetails } = user;

  return userDetails;
}

export {
  genJWTTokens,
  genJWTTokensForUser,
  getUserDetailsFromToken,
  verifyJWTToken,
};
