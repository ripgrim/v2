ALTER TABLE "user" DROP CONSTRAINT "user_active_repo_id_repos_id_fk";
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "active_repo_id";