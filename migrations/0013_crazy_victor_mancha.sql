ALTER TABLE "users" ALTER COLUMN "user_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type" SET DEFAULT 'EMPLOYEE'::text;--> statement-breakpoint
DROP TYPE "public"."user_type";--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('SUPER_ADMIN', 'EMPLOYEE', 'MANAGER', 'ADMIN', 'TEAM_LEAD');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type" SET DEFAULT 'EMPLOYEE'::"public"."user_type";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type" SET DATA TYPE "public"."user_type" USING "user_type"::"public"."user_type";