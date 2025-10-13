import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { projects } from "./projects.js";
import { Tasks } from "./tasks.js";
import { relations } from "drizzle-orm";
export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").references(() => users.id),
    sender_id: integer("sender_id").references(() => users.id),
    project_id: integer("project_id").references(() => projects.id),
    task_id: integer("task_id").references(() => Tasks.id),
    title: text("title"),
    message: text("message").notNull(),
    type: text("type").default("message"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});
export const notificationRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.user_id],
        references: [users.id],
    }),
    sender: one(users, {
        fields: [notifications.sender_id],
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
