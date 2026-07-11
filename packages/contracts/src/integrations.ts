import { z } from "zod";

/** Integrations domain, extracted from the demo's `src/lib/integrations.types.ts`. */

export const githubAccountSchema = z.object({
	id: z.string(),
	/** The org/user handle, e.g. "vercel". */
	login: z.string(),
	name: z.string(),
	type: z.enum(["Organization", "User"]),
	avatarUrl: z.string(),
	/** Whether the app can see every repo or a hand-picked subset. */
	repoAccess: z.enum(["all", "selected"]),
	repoCount: z.number(),
	installedAt: z.string(),
});
export type GithubAccount = z.infer<typeof githubAccountSchema>;

export const connectedRepoSchema = z.object({
	id: z.string(),
	owner: z.string(),
	name: z.string(),
	fullName: z.string(),
	private: z.boolean(),
	/** Last push to the repo. */
	pushedAt: z.string(),
	/** Items currently flagged in the moderation queue for this repo. */
	openFlags: z.number(),
	stars: z.number(),
});
export type ConnectedRepo = z.infer<typeof connectedRepoSchema>;

export const githubIntegrationSchema = z.object({
	accounts: z.array(githubAccountSchema),
	repos: z.array(connectedRepoSchema),
	/** The repo modkit is actively moderating. */
	activeRepoId: z.string(),
});
export type GithubIntegration = z.infer<typeof githubIntegrationSchema>;
