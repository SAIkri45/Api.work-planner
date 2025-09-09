import { and, eq, gte } from "drizzle-orm";
import { db } from "../db/configuration.js";
import { users } from "../db/schema/users.js";
import { getSingleRecordByAColumnValue } from "../services/db/baseDbService.js";
import { OTPs } from "../db/schema/otp.js";
import dayjs from "dayjs";
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
export async function isOtpExpiresForPhone(phone, action, otp) {
    const otpRecord = await db.select({ id: OTPs.id })
        .from(OTPs)
        .where(and(eq(OTPs.phone, phone), eq(OTPs.action, action), eq(OTPs.otp, otp), gte(OTPs.expires_at, dayjs.utc().toDate())))
        .limit(1);
    return otpRecord.length > 0;
}
export async function isOtpExpiresForEmail(email, action, otp) {
    const otpRecord = await db.select({ id: OTPs.id })
        .from(OTPs)
        .where(and(eq(OTPs.email, email), eq(OTPs.action, action), eq(OTPs.otp, otp), gte(OTPs.expires_at, dayjs.utc().toDate())))
        .limit(1);
    return otpRecord.length > 0;
}
