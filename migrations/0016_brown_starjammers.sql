ALTER TABLE "projects" ALTER COLUMN "project_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "project_status" SET DEFAULT 'TODO'::text;--> statement-breakpoint
DROP TYPE "public"."project_status";--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('TODO', 'IN_PROGRESS', 'COMPLETED', 'REVIEW', 'OVERDUE', 'DONE');--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "project_status" SET DEFAULT 'TODO'::"public"."project_status";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "project_status" SET DATA TYPE "public"."project_status" USING "project_status"::"public"."project_status";