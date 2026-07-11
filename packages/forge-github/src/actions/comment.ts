import type { Verdict } from "@tripwire/contracts";
import type { GithubHttp } from "../client/http.ts";

/**
 * THE condensed comment (§7): verdict line + ONE sentence + a shields-style
 * button deep-linking the run page. The hidden marker makes subsequent events
 * EDIT the comment (upsert) — tripwire never litters a thread.
 */

export const COMMENT_MARKER = "<!-- tripwire:run -->";

const VERDICT_LINE: Record<Verdict, string> = {
	pass: "**tripwire: passed**",
	block: "**tripwire: blocked**",
	needs_review: "**tripwire: sent to review**",
};

const BADGE_COLOR: Record<Verdict, string> = {
	pass: "2ea043",
	block: "d1242f",
	needs_review: "bf8700",
};

export interface CommentInput {
	verdict: Verdict;
	/** ONE sentence of context — the presenter enforces it stays one line. */
	sentence: string;
	runUrl: string;
}

export function renderCommentBody(input: CommentInput): string {
	const sentence = input.sentence.replaceAll(/\s+/g, " ").trim();
	const badge = `[![tripwire run](https://img.shields.io/badge/tripwire-view_run-${BADGE_COLOR[input.verdict]})](${input.runUrl})`;
	return `${VERDICT_LINE[input.verdict]} — ${sentence}\n\n${badge}\n${COMMENT_MARKER}\n`;
}

interface IssueComment {
	id: number;
	body?: string;
}

/**
 * Upsert: find the marker comment on the thread and edit it; create only when
 * none exists. Idempotent by construction.
 */
export async function upsertComment(
	http: GithubHttp,
	repoFullName: string,
	number: number,
	body: string,
): Promise<{ externalId: string; created: boolean }> {
	const comments = (await http.get(
		repoFullName,
		`/repos/${repoFullName}/issues/${number}/comments?per_page=100`,
	)) as IssueComment[];
	const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER));
	if (existing) {
		await http.patch(
			repoFullName,
			`/repos/${repoFullName}/issues/comments/${existing.id}`,
			{ body },
		);
		return { externalId: String(existing.id), created: false };
	}
	const created = (await http.post(
		repoFullName,
		`/repos/${repoFullName}/issues/${number}/comments`,
		{ body },
	)) as IssueComment;
	return { externalId: String(created.id), created: true };
}
