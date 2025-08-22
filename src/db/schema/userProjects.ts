import { index, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { projects } from "./projects.js";
import { users } from "./users.js";

export const user_projects = pgTable("user_projects", {
  id: serial().primaryKey(),
  project_id: integer().references(() => projects.id),
  user_id: integer().references(() => users.id), // TODO: Array of user ids
  created_at: timestamp().defaultNow(),
  updated_at: timestamp(),
  deleted_at: timestamp(),
}, t => [
  index("user_projects_id_idx").on(t.id),
  index("user_projects_project_id_idx").on(t.project_id),
  index("user_projects_user_id_idx").on(t.user_id),

]);

export type UserProjects = typeof user_projects.$inferSelect;
export type NewUserProjects = typeof user_projects.$inferInsert;
export type UserProjectsTable = typeof user_projects;
