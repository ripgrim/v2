import type {
	ForgeAction,
	ForgeActionResult,
	ForgeAdapter,
	RawForgeEvent,
} from "@tripwire/forge";
import { executeAction } from "./actions/execute.ts";
import { GithubHttp, type GithubHttpOptions } from "./client/http.ts";
import { GithubReads } from "./client/reads.ts";
import { normalizeWebhook } from "./webhook/normalize.ts";
import { verifyWebhookSignature } from "./webhook/verify.ts";

/** The assembled GitHub ForgeAdapter (§4): inbound + reads + actions. */
export function createGithubAdapter(options: GithubHttpOptions): ForgeAdapter {
	const http = new GithubHttp(options);
	const reads = new GithubReads(options);
	return {
		forge: "github",
		verifyWebhook(event: RawForgeEvent, secret: string): boolean {
			return verifyWebhookSignature(event, secret);
		},
		normalizeWebhook(event: RawForgeEvent, receivedAt: string) {
			return normalizeWebhook(event, receivedAt);
		},
		getDiff: (repo, number) => reads.getDiff(repo, number),
		getCommits: (repo, number) => reads.getCommits(repo, number),
		readFile: (repo, path, ref) => reads.readFile(repo, path, ref),
		getContributorProfile: (repo, login) =>
			reads.getContributorProfile(repo, login),
		execute(action: ForgeAction): Promise<ForgeActionResult> {
			return executeAction(http, action);
		},
	};
}
