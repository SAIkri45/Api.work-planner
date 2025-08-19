import { and, eq } from "drizzle-orm";
import { db } from "../db/configuration.js";
import { users } from "../db/schema/user.js";
import { getSingleRecordByAColumnValue } from "../services/db/baseDbService.js";
// Check if email exists and return a boolean accordingly
export async function userEmailExists(email) {
    const columnsToSelect = ["id", "email"];
    const result = await getSingleRecordByAColumnValue(users, "email", email, columnsToSelect);
    return !!result;
}
// checks the phone number exists
export async function phoneExist(phone) {
    const existingUser = await db
        .select()
        .from(users)
        .where(and(eq(users.phone, phone)));
    return existingUser.length > 0;
}
