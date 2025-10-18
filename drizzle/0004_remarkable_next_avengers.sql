ALTER TABLE "asf" ALTER COLUMN "files" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "sap" ALTER COLUMN "files" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "asf" ADD COLUMN "finance_review_status" text DEFAULT 'Pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "asf" ADD COLUMN "finance_comments" json;--> statement-breakpoint
ALTER TABLE "asf" ADD COLUMN "finance_reviewed_by" varchar;--> statement-breakpoint
ALTER TABLE "asf" ADD COLUMN "finance_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "asf" ADD COLUMN "activities_review_status" text DEFAULT 'Pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "asf" ADD COLUMN "activities_comments" json;--> statement-breakpoint
ALTER TABLE "asf" ADD COLUMN "activities_reviewed_by" varchar;--> statement-breakpoint
ALTER TABLE "asf" ADD COLUMN "activities_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "sap" ADD COLUMN "finance_review_status" text DEFAULT 'Pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "sap" ADD COLUMN "finance_comments" json;--> statement-breakpoint
ALTER TABLE "sap" ADD COLUMN "finance_reviewed_by" varchar;--> statement-breakpoint
ALTER TABLE "sap" ADD COLUMN "finance_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "sap" ADD COLUMN "activities_review_status" text DEFAULT 'Pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "sap" ADD COLUMN "activities_comments" json;--> statement-breakpoint
ALTER TABLE "sap" ADD COLUMN "activities_reviewed_by" varchar;--> statement-breakpoint
ALTER TABLE "sap" ADD COLUMN "activities_reviewed_at" timestamp;