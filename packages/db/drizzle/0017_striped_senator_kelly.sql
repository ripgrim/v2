CREATE TABLE "repo_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"repo_id" text NOT NULL,
	"kind" text NOT NULL,
	"values" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repo_suggestions" ADD CONSTRAINT "repo_suggestions_repo_id_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "repo_suggestions_repo_kind_unique" ON "repo_suggestions" USING btree ("repo_id","kind");