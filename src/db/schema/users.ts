import { relations } from "drizzle-orm";
import { boolean, index, pgEnum, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { object, string, optional } from "valibot";

import { user_projects } from "./userProjects.js";

export const userTypesEnum = pgEnum("user_type", ["SUPER_ADMIN", "EMPLOYEE", "MANAGER", "ADMIN", "TL"]);
export const userStatuses = pgEnum("user_status", ["ACTIVE", "INACTIVE"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  slack_id: varchar(),
  user_name: varchar(),
  display_name: varchar(),
  email: varchar(),
  profile_pic: varchar(),
  designation: varchar(),
  phone: varchar(),
  user_type: userTypesEnum("user_type").default("EMPLOYEE"),
  user_status: userStatuses("user_status").default("ACTIVE"),
  is_verified: boolean(),
  is_new_user: boolean(),
  created_at: timestamp().defaultNow(),
  updated_at: timestamp(),
  deleted_at: timestamp(),
}, t => [
  uniqueIndex("users_email_idx").on(t.email),
  uniqueIndex("users_phone_idx").on(t.phone),
  uniqueIndex("users_slack_id_idx").on(t.slack_id),
  index("users_created_at_idx").on(t.created_at),
  index("users_user_type_idx").on(t.user_type),

]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UsersTable = typeof users;

export const userRelations = relations(users, ({ many }) => ({
  user_projects: many(user_projects),
}));