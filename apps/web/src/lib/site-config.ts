type SiteConfig = {
	name: string;
	tagline: string;
	themeColor: string;
	githubRepositoryUrl: string;
	defaultTitle: string;
	defaultDescription: string;
};

export const siteConfig: SiteConfig = {
	name: "modkit",
	tagline: "Triage your community without the noise.",
	themeColor: "#00C943",
	githubRepositoryUrl: "https://github.com/stylessh/modkit",
	defaultTitle: "modkit | GitHub moderation, without the noise",
	defaultDescription:
		"modkit is a fast, design-first moderation dashboard for triaging flagged issues, pull requests, and comments across your GitHub org.",
};

// The signed-in moderator. In a real deployment this comes from the session.
export const MODERATOR = {
	name: "grim",
	login: "ripgrim",
	image: "https://github.com/ripgrim.png",
};
