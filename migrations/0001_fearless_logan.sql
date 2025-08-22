CREATE TYPE "public"."project_status" AS ENUM('NEW', 'IN_PROGRESS', 'COMPLETED', 'REVIEW', 'OVERDUE', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('SUPER_ADMIN', 'EMPLOYEE', 'MANAGER', 'ADMIN', 'TL');--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "project_status" SET DEFAULT 'NEW'::"public"."project_status";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "project_status" SET DATA TYPE "public"."project_status" USING "project_status"::"public"."project_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type" SET DEFAULT 'EMPLOYEE'::"public"."user_type";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type" SET DATA TYPE "public"."user_type" USING "user_type"::"public"."user_type";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_status" SET DEFAULT 'ACTIVE'::"public"."user_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_status" SET DATA TYPE "public"."user_status" USING "user_status"::"public"."user_status";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;