import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { projects } from "./projects.js";
import { Tasks } from "./tasks.js";
import { relations } from "drizzle-orm";



export const chats = pgTable("chats",{
        id: serial("id").primaryKey().notNull(),
        user_id: integer("user_id").notNull().references(() => users.id),
        project_id: integer("project_id").references(() => projects.id),
        task_id:integer("task_id").references(() => Tasks.id),
        description: text("description").notNull(),
        created_at: timestamp("created_at").notNull().defaultNow(),
        updated_at: timestamp("updated_at").notNull().defaultNow(),
        deleted_at: timestamp("deleted_at")
    })

export type Chats = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type ChatTable = typeof chats;


export const chatRelations = relations(chats, ({ one }) => ({
    user: one(users, {
        fields: [chats.user_id],
        references: [users.id],
    }),
    project: one(projects, {
        fields: [chats.project_id],
        references: [projects.id],
    }),
    task: one(Tasks, {
        fields: [chats.task_id],
        references: [Tasks.id],
    }),
}))