import { bigint, index, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
export const slack_tokens = pgTable("slack_tokens", {
    id: serial().primaryKey(),
    user_id: varchar(),
    access_token: text().notNull(),
    expires_at: bigint({ mode: "number" }).notNull(),
    refresh_token: text().notNull(),
    created_at: timestamp().defaultNow(),
    updated_at: timestamp().defaultNow(),
}, t => [
    index("slack_tokens_user_id_idx").on(t.user_id),
    index("slack_tokens_refresh_token_idx").on(t.refresh_token),
]);
