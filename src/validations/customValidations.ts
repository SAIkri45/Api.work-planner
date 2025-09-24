import dayjs from "dayjs";
import { and, eq, gte, not, or } from "drizzle-orm";

import type { User } from "../db/schema/users.js";

import { db } from "../db/configuration.js";
import { OTPs } from "../db/schema/otp.js";
import { users } from "../db/schema/users.js";
import { getSingleRecordByAColumnValue, getSingleRecordByMultipleColumnValues } from "../services/db/baseDbService.js";

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

export async function isOtpExpiresForPhone(phone: string, action: string, otp: string) {
  const otpRecord = await db.select({ id: OTPs.id })
    .from(OTPs)
    .where(and(
      eq(OTPs.phone, phone),
      eq(OTPs.action, action),
      eq(OTPs.otp, otp),
      gte(OTPs.expires_at, dayjs.utc().toDate()),
    ))
    .limit(1);

  return otpRecord.length > 0;
}

export async function isOtpExpiresForEmail(email: string, action: string, otp: string) {
  const otpRecord = await db.select({ id: OTPs.id })
    .from(OTPs)
    .where(and(
      eq(OTPs.email, email),
      eq(OTPs.action, action),
      eq(OTPs.otp, otp),
      gte(OTPs.expires_at, dayjs.utc().toDate()),
    ))
    .limit(1);

  return otpRecord.length > 0;
}

export async function checkEmailAndPhoneExistExceptUserId(email: string, phone: string, userId: number) {
  if (!email && !phone) {
    return { emailExists: false, phoneExists: false };
  }

  const conditions = [];
  if (email)
    conditions.push(eq(users.email, email));
  if (phone)
    conditions.push(eq(users.phone, phone));

  const existingUsers = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
    })
    .from(users)
    .where(and(
      or(...conditions),
      not(eq(users.id, userId)),
    ));

  const emailExists = email ? existingUsers.some(user => user.email === email) : false;
  const phoneExists = phone ? existingUsers.some(user => user.phone === phone) : false;

  return { emailExists, phoneExists };
}

export async function checkEmailAndPhoneExist(email: string, phone: string) {
  if (!email && !phone) {
    return { emailExists: false, phoneExists: false };
  }

  const conditions = [];
  if (email)
    conditions.push(eq(users.email, email));
  if (phone)
    conditions.push(eq(users.phone, phone));

  const existingUsers = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
    })
    .from(users)
    .where(and(
      or(...conditions),
      eq(users.user_status, "ACTIVE"),
    ));

  const emailExists = email ? existingUsers.some(user => user.email === email) : false;
  const phoneExists = phone ? existingUsers.some(user => user.phone === phone) : false;

  return { emailExists, phoneExists };
}

export async function checkEmailExist(email: string) {
  const columnsToSelect = ["id", "email"] as const;

  const result = await getSingleRecordByMultipleColumnValues<User>(users, ["email", "user_status", "deleted_at"], [email, "ACTIVE", null], columnsToSelect);

  return !result;
}
