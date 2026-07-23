import { type AnySignal, defineSignal, t } from "./signal.ts";

//contributor: the account iself
export const accountAge = defineSignal({
	id: "contributor.accountAge",
	scope: "contributor",
	type: t.number,
	describe: "Days since the contributor's account was created",
});

export const followers = defineSignal({
	id: "contributor.followers",
	scope: "contributor",
	type: t.number,
	describe: "How many accounts follow the contributor",
});

export const following = defineSignal({
	id: "contributor.following",
	scope: "contributor",
	type: t.number,
	describe: "How many accounts the contributor follows",
});

export const publicRepos = defineSignal({
	id: "contributor.publicRepos",
	scope: "contributor",
	type: t.number,
	describe: "How many public repositories the contributor owns",
});

export const profileText = defineSignal({
	id: "contributor.profileText",
	scope: "contributor",
	type: t.text,
	describe: "Profile readme or bio text, empty when the profile has none",
});

export const mergedElsewhere = defineSignal({
	id: "contributor.mergedElsewhere",
	scope: "contributor",
	type: t.number,
	describe:
		"Merged change requests in repos the contributor does not own. Proof that someone else accepted their work",
});

export const publicGists = defineSignal({
	id: "contributor.publicGists",
	scope: "contributor",
	type: t.number,
	describe: "How many public gists the contributor has",
});

export const hireable = defineSignal({
	id: "contributor.hireable",
	scope: "contributor",
	type: t.boolean,
	describe:
		"True when the contributor marks themselves hireable on their profile. GitHub stores only true or unset; unset reads as false",
});

export const company = defineSignal({
	id: "contributor.company",
	scope: "contributor",
	type: t.text,
	describe: "The company field on the contributor's profile, empty when unset",
});

export const location = defineSignal({
	id: "contributor.location",
	scope: "contributor",
	type: t.text,
	describe: "The location field on the contributor's profile, empty when unset",
});

export const prsOpened = defineSignal({
	id: "contributor.prsOpened",
	scope: "contributor",
	type: t.number,
	describe: "How many change requests the contributor has opened anywhere",
});

/**
 * History is 7 days, not 30: GitHub's per-user events feed reaches at most
 * 90 days or the most recent 300 events, whichever is smaller, so 7 days is
 * the honest declaration. Truncation can only undercount, and only for
 * accounts active enough that any sane threshold already fired.
 */
export const recentForkTimes = defineSignal({
	id: "contributor.recentForkTimes",
	scope: "contributor",
	type: t.timestamps,
	history: "7d",
	describe:
		"Timestamps of the contributor's public fork events from the last seven days, newest first. GitHub's feed caps at 300 events, so a hyperactive account can only undercount, and the feed can lag by minutes",
});

// SHAPE-CHECK: the signal stays WIDE (30 days) so a rule's .last() transform
// reads from enough history. Rules narrow; the signal never truncates.
export const recentChangeRequestTimes = defineSignal({
	id: "contributor.recentChangeRequestTimes",
	scope: "contributor",
	type: t.timestamps,
	history: "30d",
	describe:
		"Timestamps of the contributor's change requests from the last thirty days, newest first",
});

// --- repoRelation: the contributor's standing in the subject repo ----------

export const mergedInRepo = defineSignal({
	id: "repoRelation.mergedInRepo",
	scope: "repoRelation",
	type: t.number,
	describe: "Merged change requests by the contributor in this repo",
});

export const isOrgMember = defineSignal({
	id: "repoRelation.isOrgMember",
	scope: "repoRelation",
	type: t.boolean,
	describe: "True when the contributor is a member of the repo's org",
});

export const issuesOpenedInRepo = defineSignal({
	id: "repoRelation.issuesOpenedInRepo",
	scope: "repoRelation",
	type: t.number,
	describe: "How many issues the contributor has opened in this repo",
});

export const closedUnmergedInRepo = defineSignal({
	id: "repoRelation.closedUnmergedInRepo",
	scope: "repoRelation",
	type: t.number,
	describe:
		"How many of the contributor's change requests here were closed without merging",
});

export const commentedInRepo = defineSignal({
	id: "repoRelation.commentedInRepo",
	scope: "repoRelation",
	type: t.number,
	describe:
		"How many issues and change requests here the contributor has commented on. Counts threads, not individual comments",
});

export const isMaintainer = defineSignal({
	id: "repoRelation.isMaintainer",
	scope: "repoRelation",
	type: t.boolean,
	describe: "True when the contributor has write access to the repo",
});

// --- pr: the change request under evaluation --------------------------------

export const title = defineSignal({
	id: "pr.title",
	scope: "pr",
	type: t.text,
	describe: "The change request's title",
});

export const filesChanged = defineSignal({
	id: "pr.filesChanged",
	scope: "pr",
	type: t.number,
	describe: "How many files the change request touches",
});

export const changedPaths = defineSignal({
	id: "pr.changedPaths",
	scope: "pr",
	type: t.textList,
	describe: "The paths the change request touches",
});

export const linesAdded = defineSignal({
	id: "pr.linesAdded",
	scope: "pr",
	type: t.number,
	describe: "How many lines the change request adds",
});

export const linesDeleted = defineSignal({
	id: "pr.linesDeleted",
	scope: "pr",
	type: t.number,
	describe: "How many lines the change request deletes",
});

export const linesChanged = defineSignal({
	id: "pr.linesChanged",
	scope: "pr",
	type: t.number,
	describe:
		"How many lines the change request touches, additions plus deletions",
});

export const commitCount = defineSignal({
	id: "pr.commitCount",
	scope: "pr",
	type: t.number,
	describe: "How many commits the change request carries",
});

export const verifiedCommits = defineSignal({
	id: "pr.verifiedCommits",
	scope: "pr",
	type: t.number,
	describe:
		"How many of the change request's commits carry a verified signature",
});

export const allCommitsVerified = defineSignal({
	id: "pr.allCommitsVerified",
	scope: "pr",
	type: t.boolean,
	describe:
		"True when every commit in the change request carries a verified signature",
});

// SHAPE-CHECK: forge-neutral when a second forge is added.
export const patchByPath = defineSignal({
	id: "pr.patchByPath",
	scope: "pr",
	type: t.textMap,
	describe: "Unified diff text keyed by the file path it belongs to",
});

/**
 * The scan input for pattern rules. Insertion order is the scan order and
 * the match evidence order: comment, then title, then diff patch paths in
 * diff order. Absent sources are absent keys, never an unavailable signal.
 */
export const textByLocation = defineSignal({
	id: "pr.textByLocation",
	scope: "pr",
	type: t.textMap,
	describe:
		"The event's text keyed by where it appears: comment, title, and diff patch paths",
});

// --- comment: the comment that triggered the evaluation ---------------------

export const commentBody = defineSignal({
	id: "comment.body",
	scope: "comment",
	type: t.text,
	describe: "The comment's body text",
});

/** Every signal, keyed by id. This is what the producer map is typed against. */
export const registry = {
	[accountAge.id]: accountAge,
	[followers.id]: followers,
	[following.id]: following,
	[publicRepos.id]: publicRepos,
	[profileText.id]: profileText,
	[mergedElsewhere.id]: mergedElsewhere,
	[recentChangeRequestTimes.id]: recentChangeRequestTimes,
	[publicGists.id]: publicGists,
	[hireable.id]: hireable,
	[company.id]: company,
	[location.id]: location,
	[prsOpened.id]: prsOpened,
	[recentForkTimes.id]: recentForkTimes,
	[mergedInRepo.id]: mergedInRepo,
	[isOrgMember.id]: isOrgMember,
	[isMaintainer.id]: isMaintainer,
	[issuesOpenedInRepo.id]: issuesOpenedInRepo,
	[closedUnmergedInRepo.id]: closedUnmergedInRepo,
	[commentedInRepo.id]: commentedInRepo,
	[title.id]: title,
	[filesChanged.id]: filesChanged,
	[changedPaths.id]: changedPaths,
	[patchByPath.id]: patchByPath,
	[linesAdded.id]: linesAdded,
	[linesDeleted.id]: linesDeleted,
	[linesChanged.id]: linesChanged,
	[commitCount.id]: commitCount,
	[verifiedCommits.id]: verifiedCommits,
	[allCommitsVerified.id]: allCommitsVerified,
	[textByLocation.id]: textByLocation,
	[commentBody.id]: commentBody,
} as const satisfies Record<string, AnySignal>;

export type SignalRegistry = typeof registry;
export type SignalId = keyof SignalRegistry;

/**
 * The nested authoring surface, signals.<scope>.<name>. Phase 2's client
 * narrows this tree to the bound forge's producers.
 */
export const signalTree = {
	contributor: {
		accountAge,
		followers,
		following,
		publicRepos,
		publicGists,
		profileText,
		mergedElsewhere,
		recentChangeRequestTimes,
		recentForkTimes,
		prsOpened,
		hireable,
		company,
		location,
	},
	repoRelation: {
		mergedInRepo,
		isOrgMember,
		isMaintainer,
		issuesOpenedInRepo,
		closedUnmergedInRepo,
		commentedInRepo,
	},
	pr: {
		title,
		filesChanged,
		changedPaths,
		patchByPath,
		textByLocation,
		linesAdded,
		linesDeleted,
		linesChanged,
		commitCount,
		verifiedCommits,
		allCommitsVerified,
	},
	comment: { body: commentBody },
};

export type SignalTree = typeof signalTree;
