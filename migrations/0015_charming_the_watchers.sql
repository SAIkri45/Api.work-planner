ALTER TABLE "tasks" ALTER COLUMN "task_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "task_status" SET DEFAULT 'TODO'::text;--> statement-breakpoint
DROP TYPE "public"."task_status";--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('TODO', 'IN_PROGRESS', 'COMPLETED', 'REVIEW', 'OVERDUE', 'DONE');--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "task_status" SET DEFAULT 'TODO'::"public"."task_status";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "task_status" SET DATA TYPE "public"."task_status" USING "task_status"::"public"."task_status";