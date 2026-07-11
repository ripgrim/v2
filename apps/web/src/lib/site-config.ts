type SiteConfig = {
	name: string;
	tagline: string;
	themeColor: string;
	githubRepositoryUrl: string;
	defaultTitle: string;
	defaultDescription: string;
};

export const siteConfig: SiteConfig = {
	name: "tripwire",
	tagline: "a firewall for your repo.",
	themeColor: "#00C943",
	githubRepositoryUrl: "https://github.com/normal-software-inc/tripwire",
	defaultTitle: "tripwire | the open source firewall for git",
	defaultDescription:
		"tripwire is a contribution gatekeeper for git forges. it evaluates contributors and change requests against composable rules, blocks slop before it lands, and keeps every verdict auditable.",
};

// The signed-in moderator. In a real deployment this comes from the session.
export const MODERATOR = {
	name: "grim",
	login: "ripgrim",
	image: "https://github.com/ripgrim.png",
};
