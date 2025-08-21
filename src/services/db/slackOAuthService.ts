import { eq } from "drizzle-orm";

import type { RefreshedTokenData } from "../../types/appTypes.js";

import { db } from "../../db/configuration.js";
import { slack_tokens } from "../../db/schema/slackTokens.js";
import { users } from "../../db/schema/users.js";

export async function checkSlackUserExists(email: string) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  return existingUser[0];
}

export async function getSlackTokenByUserId(userId: string) {
  const token = await db
    .select()
    .from(slack_tokens)
    .where(eq(slack_tokens.user_id, userId));
  return token[0];
}

export async function updateSlackToken(user_id: string, refreshed_token_data: RefreshedTokenData) {
  const result = await db
    .update(slack_tokens)
    .set({
      access_token: refreshed_token_data.access_token,
      expires_at: refreshed_token_data.expires_at,
      refresh_token: refreshed_token_data.refresh_token,
      updated_at: new Date(),
    })
    .where(eq(slack_tokens.user_id, user_id));

  return result;
}
