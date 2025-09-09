import { bigint, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
export const refresh_tokens = pgTable("refresh_tokens", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").references(() => users.id).notNull(),
    refresh_token: text("refresh_token").notNull(),
    expires_at: bigint("expires_at", { mode: "number" }).notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
}, t => [
    index("refresh_tokens_user_id_idx").on(t.user_id),
    index("refresh_tokens_refresh_token_idx").on(t.refresh_token),
]);
