import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects.js";
import { Tasks } from "./tasks.js";
import { users } from "./users.js";
export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").references(() => users.id),
    project_id: integer("project_id").references(() => projects.id),
    task_id: integer("task_id").references(() => Tasks.id),
    title: text("title"),
    description: text("description").notNull(),
    category: text("category").default("message"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
    is_marked: boolean("is_marked").default(false)
});
export const notificationRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.user_id],
        references: [users.id],
    }),
    project: one(projects, {
        fields: [notifications.project_id],
        references: [projects.id],
    }),
    task: one(Tasks, {
        fields: [notifications.task_id],
        references: [Tasks.id],
    }),
}));
