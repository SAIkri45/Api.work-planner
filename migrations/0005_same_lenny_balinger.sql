ALTER TABLE "users" ADD COLUMN "password" varchar DEFAULT '123456' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_new_user";