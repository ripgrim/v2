import { type Db, repoServices } from "@tripwire/db";
import { type GithubHttp, githubForge } from "@tripwire/forge-github";

/**
 * Refreshes the cached branch suggestions for a repo. The worker holds the
 * installation token and runs on push/install, so the web never calls GitHub;
 * it reads the cached row. Best effort: a failed fetch leaves the old cache (or
 * none), and the builder falls back to free text. Keeps suggestions fresh on
 * fast-moving repos, where a TTL alone would lag.
 */
export async function refreshBranchSuggestions(
	db: Db,
	http: GithubHttp | null | undefined,
	repoId: string,
	repoFullName: string,
): Promise<void> {
	const suggester = githubForge.suggest?.branches;
	if (!http || !suggester) {
		return;
	}
	try {
		const branches = await suggester({ forge: http, repo: repoFullName });
		await repoServices.upsertRepoSuggestions(db, repoId, "branches", branches);
	} catch {
		// Stale or missing suggestions are acceptable; never fail the job.
	}
}
