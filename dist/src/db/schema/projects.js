import { relations } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { Tasks } from "./tasks.js";
import { user_projects } from "./userProjects.js";
import { users } from "./users.js";
export const projectStatuses = pgEnum("project_status", ["NEW", "IN_PROGRESS", "COMPLETED", "REVIEW", "OVERDUE", "DONE"]);
export const projects = pgTable("projects", {
    id: serial().primaryKey(),
    title: varchar().notNull(),
    description: varchar(),
    logo_url: text(),
    project_links: text(),
    created_by: integer().references(() => users.id),
    updated_by: integer().references(() => users.id),
    project_status: projectStatuses("project_status").default("NEW"),
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
export const projectRelations = relations(projects, ({ many }) => ({
    userProjects: many(user_projects),
    tasks: many(Tasks),
}));
