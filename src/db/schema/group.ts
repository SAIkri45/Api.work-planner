// groupsSchema.ts

import { index, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const groups = pgTable("groups", {
  id: serial().primaryKey(),
  title: varchar().notNull(),
  contacts_count: integer().default(0),
  created_by: integer(),
  created_at: timestamp().defaultNow(),
  updated_at: timestamp(),
  deleted_at: timestamp(),
}, t => [
  index("groups_title_idx").on(t.title),
  index("groups_ created_by_idx").on(t.title),
]);

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupsTable = typeof groups;
