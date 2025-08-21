import { index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const projects = pgTable("projects", {
    id: serial().primaryKey(),
    title: varchar().notNull(),
    description: varchar(),
    logo_url: text(),
    project_links: text(),
    created_by: integer().references(() => users.id),
    project_status: varchar().default("NEW"),
    start_date: timestamp(),
    due_date: timestamp(),
    created_at: timestamp().defaultNow(),
    updated_at: timestamp(),
    deleted_at: timestamp(),
}, t => [
    index("projects_id_idx").on(t.id),
    index("projects_title_idx").on(t.title),
    index("projects_created_by_idx").on(t.created_by),

]);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectsTable = typeof projects;
