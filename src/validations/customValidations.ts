import { and, eq } from "drizzle-orm";

import type { User } from "../db/schema/users.js";

import { db } from "../db/configuration.js";
import { users } from "../db/schema/users.js";
import { getSingleRecordByAColumnValue } from "../services/db/baseDbService.js";

// Check if email exists and return a boolean accordingly
export async function userEmailExists(email: string) {
  const columnsToSelect = ["id", "email"] as const;

  const result = await getSingleRecordByAColumnValue<User, (typeof columnsToSelect)[number]>(users, "email", email, columnsToSelect);

  return !!result;
}

// checks the phone number exists
export async function phoneExist(phone: string) {
  const existingUser = await db
    .select()
    .from(users)
    .where(and(eq(users.phone, phone)));

  return existingUser.length > 0;
}
