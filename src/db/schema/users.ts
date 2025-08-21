import { index, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial().primaryKey(),
  slack_id: varchar().notNull(),
  user_name: varchar(),
  display_name: varchar(),
  email: varchar(),
  profile_pic: varchar(),
  designation: varchar(),
  phone: varchar(),
  user_type: varchar().default("EMPLOYEE"),
  // active: boolean().default(true),
  user_status: varchar().default("ACTIVE"),
  created_at: timestamp().defaultNow(),
  updated_at: timestamp(),
  deleted_at: timestamp(),
}, t => [
  index("users_id_idx").on(t.id),
  index("users_email_idx").on(t.email),
  index("users_slack_id_idx").on(t.slack_id),

]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UsersTable = typeof users;
