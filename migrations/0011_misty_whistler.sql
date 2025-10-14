ALTER TABLE "notifications" RENAME COLUMN "sender_id" TO "is_marked";--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_sender_id_users_id_fk";
