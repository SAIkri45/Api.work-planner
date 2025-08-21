CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" varchar,
	"logo_url" text,
	"project_links" text,
	"created_by" integer,
	"project_status" varchar DEFAULT 'NEW',
	"start_date" timestamp,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "slack_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"access_token" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"refresh_token" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"user_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"slack_id" varchar NOT NULL,
	"user_name" varchar,
	"display_name" varchar,
	"email" varchar,
	"profile_pic" varchar,
	"designation" varchar,
	"phone" varchar,
	"user_type" varchar DEFAULT 'EMPLOYEE',
	"user_status" varchar DEFAULT 'ACTIVE',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_id_idx" ON "projects" USING btree ("id");--> statement-breakpoint
CREATE INDEX "projects_title_idx" ON "projects" USING btree ("title");--> statement-breakpoint
CREATE INDEX "projects_created_by_idx" ON "projects" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "slack_tokens_user_id_idx" ON "slack_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "slack_tokens_refresh_token_idx" ON "slack_tokens" USING btree ("refresh_token");--> statement-breakpoint
CREATE INDEX "user_projects_id_idx" ON "user_projects" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_projects_project_id_idx" ON "user_projects" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "user_projects_user_id_idx" ON "user_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_id_idx" ON "users" USING btree ("id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_slack_id_idx" ON "users" USING btree ("slack_id");