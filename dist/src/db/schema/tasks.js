import { index, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects.js";
import { users } from "./users.js";
// Task status enum
export const taskStatuses = pgEnum("task_status", ["NEW", "IN_PROGRESS", "COMPLETED", "REVIEW", "OVERDUE", "DONE",]);
export const Tasks = pgTable("tasks", {
    id: serial().primaryKey(),
    task_title: varchar().notNull(),
    project_id: integer().references(() => projects.id),
    description: text(),
    task_status: taskStatuses("task_status").default("NEW"),
    created_by: integer().references(() => users.id),
    updated_by: integer().references(() => users.id),
    start_date: timestamp({ mode: "string" }),
    end_date: timestamp({ mode: "string" }),
    created_at: timestamp().defaultNow(),
    updated_at: timestamp(),
    deleted_at: timestamp(),
}, (t) => [
    index("tasks_id_idx").on(t.id),
    index("tasks_project_id_idx").on(t.project_id),
    index("tasks_created_by_idx").on(t.created_by),
    index("tasks_status_idx").on(t.task_status),
]);
