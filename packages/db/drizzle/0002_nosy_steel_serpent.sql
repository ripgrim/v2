CREATE TABLE "user_installations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"forge" text DEFAULT 'github' NOT NULL,
	"installation_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "active_repo_id" text;--> statement-breakpoint
ALTER TABLE "user_installations" ADD CONSTRAINT "user_installations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_installations_forge_installation_unique" ON "user_installations" USING btree ("forge","installation_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_active_repo_id_repos_id_fk" FOREIGN KEY ("active_repo_id") REFERENCES "public"."repos"("id") ON DELETE no action ON UPDATE no action;