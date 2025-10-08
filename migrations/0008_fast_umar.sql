-- =========================
-- Create tables if not exist
-- =========================
CREATE TABLE IF NOT EXISTS "device_tokens" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "device_token" text NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "otps" (
    "id" serial PRIMARY KEY NOT NULL,
    "email" varchar,
    "action" varchar NOT NULL,
    "phone" varchar,
    "otp" varchar,
    "is_verified" boolean DEFAULT false,
    "profile_pic" varchar,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp
);

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "refresh_token" text NOT NULL,
    "expires_at" bigint NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "task_assignees" (
    "id" serial PRIMARY KEY NOT NULL,
    "task_id" integer,
    "user_id" integer,
    "task_title" varchar,
    "created_by" integer,
    "updated_by" integer,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp,
    "deleted_at" timestamp
);

-- =========================
-- Drop indexes if exist
-- =========================
DROP INDEX IF EXISTS "users_id_idx";
DROP INDEX IF EXISTS "users_email_idx";
DROP INDEX IF EXISTS "users_slack_id_idx";

-- =========================
-- Alter tables
-- =========================
ALTER TABLE "tasks" ALTER COLUMN "project_id" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "slack_id" DROP NOT NULL;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "password" varchar DEFAULT '123456' NOT NULL;

-- =========================
-- Add foreign keys (only if not exist)
-- =========================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'device_tokens_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "device_tokens"
        ADD CONSTRAINT "device_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'refresh_tokens_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "refresh_tokens"
        ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_assignees_task_id_tasks_id_fk'
    ) THEN
        ALTER TABLE "task_assignees"
        ADD CONSTRAINT "task_assignees_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_assignees_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "task_assignees"
        ADD CONSTRAINT "task_assignees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_assignees_created_by_users_id_fk'
    ) THEN
        ALTER TABLE "task_assignees"
        ADD CONSTRAINT "task_assignees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_assignees_updated_by_users_id_fk'
    ) THEN
        ALTER TABLE "task_assignees"
        ADD CONSTRAINT "task_assignees_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

-- =========================
-- Create indexes if not exist
-- =========================
CREATE INDEX IF NOT EXISTS "device_tokens_user_id_idx" ON "device_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "device_tokens_device_token_idx" ON "device_tokens" ("device_token");

CREATE INDEX IF NOT EXISTS "otps_phone_idx" ON "otps" ("phone");

CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_refresh_token_idx" ON "refresh_tokens" ("refresh_token");

CREATE INDEX IF NOT EXISTS "task_assignees_id_idx" ON "task_assignees" ("id");
CREATE INDEX IF NOT EXISTS "task_assignees_task_id_idx" ON "task_assignees" ("task_id");
CREATE INDEX IF NOT EXISTS "task_assignees_user_id_idx" ON "task_assignees" ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_idx" ON "users" ("phone");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");
CREATE INDEX IF NOT EXISTS "users_user_type_idx" ON "users" ("user_type");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_slack_id_idx" ON "users" ("slack_id");
