import type { ForgeAction, ForgeActionResult } from "@tripwire/forge";
import type { GithubHttp } from "../client/http.ts";
import { setCheck } from "./check.ts";
import { upsertComment } from "./comment.ts";

/**
 * Executes a ForgeAction idempotently (§4). `block` carries no forge call of
 * its own: the failing `tripwire` check IS the block (§7 — required status ⇒
 * dead merge button); closing PRs is not tripwire's job. Comment and check
 * upsert their existing artifact.
 */
export async function executeAction(
	http: GithubHttp,
	action: ForgeAction,
): Promise<ForgeActionResult> {
	switch (action.kind) {
		case "block": {
			return { externalId: null };
		}
		case "label": {
			await http.post(
				action.repoFullName,
				`/repos/${action.repoFullName}/issues/${action.number}/labels`,
				{ labels: action.labels },
			);
			return { externalId: null };
		}
		case "comment": {
			const result = await upsertComment(
				http,
				action.repoFullName,
				action.number,
				action.body,
			);
			return { externalId: result.externalId };
		}
		case "request-review": {
			await http.post(
				action.repoFullName,
				`/repos/${action.repoFullName}/pulls/${action.number}/requested_reviewers`,
				{},
			);
			return { externalId: null };
		}
		case "set-check": {
			const result = await setCheck(http, action.repoFullName, action.check);
			return { externalId: result.externalId };
		}
		default: {
			action satisfies never;
			return { externalId: null };
		}
	}
}
