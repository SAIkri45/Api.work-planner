import { relations} from "drizzle-orm";
import { index, integer, pgTable, serial, timestamp,varchar } from "drizzle-orm/pg-core";
import { Tasks } from "./tasks.js";
import { users } from "./users.js";

export const task_assignees = pgTable("task_assignees", {
  id: serial().primaryKey(),
  task_id: integer().references(() => Tasks.id),
  user_id: integer().references(() => users.id),
  task_title: varchar(),
  created_by: integer().references(() => users.id),
  updated_by: integer().references(() => users.id),
  created_at: timestamp().defaultNow(),
  updated_at: timestamp(),
  deleted_at: timestamp(),
}, (t) => [
  index("task_assignees_id_idx").on(t.id),
  index("task_assignees_task_id_idx").on(t.task_id),
  index("task_assignees_user_id_idx").on(t.user_id),
]);

export type TaskAssignees = typeof task_assignees.$inferSelect;
export type NewTaskAssignees = typeof task_assignees.$inferInsert;
export type TaskAssigneesTable = typeof task_assignees;

export const taskAssigneeRelations = relations(task_assignees, ({ one }) => ({
  user: one(users, {
    fields: [task_assignees.user_id],
    references: [users.id],
  }),
  task: one(Tasks, {
    fields: [task_assignees.task_id],
    references: [Tasks.id],
  }),
}));