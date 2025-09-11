import { boolean, index, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
export const OTPs = pgTable("otps", {
  id: serial("id").primaryKey(),
  email: varchar("email"),
  action: varchar("action").notNull(),
  phone: varchar("phone"),
  otp: varchar("otp"),
  is_verified: boolean("is_verified").default(false),
  profile_pic: varchar("profile_pic"),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
}, t => [
  index("otps_phone_idx").on(t.phone),
]);
export type OTP = typeof OTPs.$inferSelect;
export type NewOTP = typeof OTPs.$inferInsert;
export type OTPsTable = typeof OTPs;