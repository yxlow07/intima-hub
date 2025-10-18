CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"action" varchar(255) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"related_form_id" uuid,
	"form_type" varchar(10),
	"old_status" varchar(50),
	"new_status" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "affiliates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"status" text NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"advisor_id" varchar NOT NULL,
	"committee_members" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asf" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"activity_name" varchar(255) NOT NULL,
	"date" timestamp NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"submitted_by" varchar NOT NULL,
	"comments" json,
	"file_url" varchar(512),
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sap" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"activity_name" varchar(255) NOT NULL,
	"date" timestamp NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"submitted_by" varchar NOT NULL,
	"comments" json,
	"file_url" varchar(512),
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submitted_by" varchar NOT NULL,
	"form_type" text NOT NULL,
	"form_id" uuid NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" text NOT NULL,
	"affiliates" jsonb DEFAULT '[]' NOT NULL,
	"permissions" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
