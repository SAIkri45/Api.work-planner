import { relations } from "drizzle-orm";
import { index, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects.js";
import { users } from "./users.js";
export const user_projects = pgTable("user_projects", {
    id: serial().primaryKey(),
    project_id: integer().references(() => projects.id),
    user_id: integer().references(() => users.id), // TODO: Array of user ids
    // project_title: varchar(),
    // user_name: varchar(),
    created_at: timestamp().defaultNow(),
    updated_at: timestamp(),
    deleted_at: timestamp(),
}, t => [
    index("user_projects_id_idx").on(t.id),
    index("user_projects_project_id_idx").on(t.project_id),
    index("user_projects_user_id_idx").on(t.user_id),
]);
export const userProjectRelations = relations(user_projects, ({ one }) => ({
    users: one(users, {
        fields: [user_projects.user_id],
        references: [users.id],
    }),
    projects: one(projects, {
        fields: [user_projects.project_id],
        references: [projects.id],
    }),
}));
