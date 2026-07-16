ALTER TABLE "user" ADD COLUMN "access_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "access_reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "access_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "waitlisted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "user_access_status_idx" ON "user" USING btree ("access_status");