import type { ThreadKind } from "#/lib/repo-analytics.types";
import type {
	CommentFlag,
	RepoContent,
	ThreadDetail,
} from "#/lib/repo-content.types";

export type UserInstance = {
	threadKind: ThreadKind;
	number: number;
	title: string;
	commentId: string;
	body: string;
	createdAt: string;
	flag?: CommentFlag;
};

export type UserProfile = {
	login: string;
	summary: {
		comments: number;
		flagged: number;
		removed: number;
		threads: number;
	};
	instances: UserInstance[];
};

function collect(
	detail: ThreadDetail,
	login: string,
	out: UserInstance[],
	threads: Set<number>,
) {
	// The opening post counts as an instance too.
	if (detail.author === login) {
		out.push({
			threadKind: detail.kind,
			number: detail.number,
			title: detail.title,
			commentId: "op",
			body: detail.body,
			createdAt: detail.openedAt,
		});
		threads.add(detail.number);
	}
	for (const c of detail.comments) {
		if (c.author !== login) continue;
		out.push({
			threadKind: detail.kind,
			number: detail.number,
			title: detail.title,
			commentId: c.id,
			body: c.body,
			createdAt: c.createdAt,
			flag: c.flag,
		});
		threads.add(detail.number);
	}
}

/** Every comment/post a login made across the repo, newest first. */
export function userInstances(
	content: RepoContent,
	login: string,
): UserProfile {
	const out: UserInstance[] = [];
	const threads = new Set<number>();
	for (const d of Object.values(content.issueDetails))
		collect(d, login, out, threads);
	for (const d of Object.values(content.pullDetails))
		collect(d, login, out, threads);
	out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

	return {
		login,
		summary: {
			comments: out.length,
			flagged: out.filter((i) => i.flag).length,
			removed: out.filter((i) => i.flag?.state === "Removed").length,
			threads: threads.size,
		},
		instances: out,
	};
}
