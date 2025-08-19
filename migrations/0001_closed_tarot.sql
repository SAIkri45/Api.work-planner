ALTER TABLE "slack_tokens" RENAME COLUMN "access_expires_at" TO "expires_at";--> statement-breakpoint
ALTER TABLE "slack_tokens" ALTER COLUMN "user_id" SET DATA TYPE varchar;