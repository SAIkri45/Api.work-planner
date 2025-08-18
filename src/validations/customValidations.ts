import { and, eq, ne } from "drizzle-orm";

import type { Group } from "../db/schema/group.js";

import { db } from "../db/configuration.js";
import { groups } from "../db/schema/group.js";
import { getSingleRecordByAColumnValue } from "../services/db/baseDbService.js";
import { User, users } from "../db/schema/user.js";


// Check if email exists and return a boolean accordingly
export async function userEmailExists(email: string) {
  const columnsToSelect = ["id", "email"] as const;

  const result = await getSingleRecordByAColumnValue<User, (typeof columnsToSelect)[number]>(users, "email", email, columnsToSelect);

  return !!result;
}

//checks the phone number exists
export async function phoneExist(phone: string) {
  const existingUser = await db
    .select()
    .from(users)
    .where(and(eq(users.phone, phone)));

  return existingUser.length > 0;
}
export async function groupTitleExists(title: string) {
  const columnsToSelect = ["id", "title", "deleted_at"] as const;

  const result = await getSingleRecordByAColumnValue<Group, typeof columnsToSelect[number]>(
    groups,
    "title",
    [title],
    columnsToSelect,
  );

  // Return true only if group exists AND is not soft-deleted
  return result && result.deleted_at === null;
}

export async function groupUpdateTitleExists(title: string, id: number) {
  const existingUser = await db
    .select()
    .from(groups)
    .where(and(eq(groups.title, title), ne(groups.id, id)));

  return existingUser.length > 0;
}
