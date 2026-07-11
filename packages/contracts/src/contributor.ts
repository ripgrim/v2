import { z } from "zod";

/**
 * Contributor domain, extracted from the demo's `src/lib/contributor.types.ts`
 * — the shape behind the `/profile/$userHandle` page.
 */

export const contributionYearSchema = z.object({
	/** Total contributions across the rendered window. */
	total: z.number(),
	/** 53 weeks × 7 days of intensity levels (0–4), oldest week first. */
	weeks: z.array(z.array(z.number())),
});
export type ContributionYear = z.infer<typeof contributionYearSchema>;

export const contributorDetailsSchema = z.object({
	accountAgeDays: z.number(),
	location: z.string().nullable(),
	emailVerified: z.boolean(),
	twoFactor: z.boolean(),
});
export type ContributorDetails = z.infer<typeof contributorDetailsSchema>;

export const contributorRepoStatsSchema = z.object({
	mergedPrs: z.number(),
	openPrs: z.number(),
	comments: z.number(),
	hiddenByAutomod: z.number(),
});
export type ContributorRepoStats = z.infer<typeof contributorRepoStatsSchema>;

export const contributorActivityKindSchema = z.enum([
	"automod-hidden",
	"pull-opened",
	"comment-removed",
	"issue-comment",
	"flagged",
	"account-created",
]);
export type ContributorActivityKind = z.infer<
	typeof contributorActivityKindSchema
>;

export const contributorActivitySchema = z.object({
	id: z.string(),
	kind: contributorActivityKindSchema,
	title: z.string(),
	detail: z.string(),
	/** ISO timestamp; rendered via formatRelativeTime. */
	at: z.string(),
});
export type ContributorActivity = z.infer<typeof contributorActivitySchema>;

export const contributorProfileSchema = z.object({
	handle: z.string(),
	/** Single-letter avatar fallback (uppercased first char of the handle). */
	initial: z.string(),
	joinedDaysAgo: z.number(),
	publicRepos: z.number(),
	followers: z.number(),
	/** Whether the moderator has this account on their watchlist. */
	watchlisted: z.boolean(),
	contributions: contributionYearSchema,
	details: contributorDetailsSchema,
	repoStats: contributorRepoStatsSchema,
	activity: z.array(contributorActivitySchema),
});
export type ContributorProfile = z.infer<typeof contributorProfileSchema>;
