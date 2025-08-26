import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { user_projects } from "./userProjects.js";

export const userTypesEnum = pgEnum("user_type", ["SUPER_ADMIN", "EMPLOYEE", "MANAGER", "ADMIN", "TL"]);
export const userStatuses = pgEnum("user_status", ["ACTIVE", "INACTIVE"]);

export const users = pgTable("users", {
  id: serial().primaryKey(),
  slack_id: varchar().notNull(),
  user_name: varchar(),
  display_name: varchar(),
  email: varchar(),
  profile_pic: varchar(),
  designation: varchar(),
  phone: varchar(),
  user_type: userTypesEnum("user_type").default("EMPLOYEE"),
  user_status: userStatuses("user_status").default("ACTIVE"),
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

export const userRelations = relations(users, ({ many }) => ({
  user_projects: many(user_projects),
}));
