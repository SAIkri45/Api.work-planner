CREATE TABLE "slack_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"access_token" text NOT NULL,
	"access_expires_at" bigint NOT NULL,
	"refresh_token" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
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
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "slack_okens_user_id_idx" ON "slack_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "slack_tokens_refresh_token_idx" ON "slack_tokens" USING btree ("refresh_token");--> statement-breakpoint
CREATE INDEX "users_id_idx" ON "users" USING btree ("id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_slack_id_idx" ON "users" USING btree ("slack_id");