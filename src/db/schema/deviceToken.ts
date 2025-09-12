import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const device_tokens = pgTable("device_tokens", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  device_token: text("device_token").notNull(),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, t =>
  [
    index("device_tokens_user_id_idx").on(t.user_id),
    index("device_tokens_device_token_idx").on(t.device_token),
  ]);
export type DeviceToken = typeof device_tokens.$inferSelect;
export type NewDeviceToken = typeof device_tokens.$inferInsert;
export type DeviceTokensTable = typeof device_tokens;
