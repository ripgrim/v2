import type {
	ConnectedRepo,
	GithubAccount,
	GithubIntegration,
} from "#/lib/integrations.types";

const DAY = 86_400_000;
const HOUR = 3_600_000;

const VERCEL_REPOS = [
	"next.js",
	"turbo",
	"ai",
	"swr",
	"satori",
	"og",
	"geist-font",
	"commerce",
	"examples",
	"analytics",
	"edge-runtime",
	"platforms",
	"style-guide",
	"micro",
	"ncc",
	"serve",
	"hyper",
	"release",
	"ms",
	"async-retry",
	"flags",
	"speed-insights",
	"otel",
	"image-optimization",
	"functions",
	"toolbar",
	"v0-sdk",
	"sandbox",
	"nuxt",
	"remote-cache",
];

const RIPGRIM_REPOS = [
	"modkit",
	"tripwire",
	"honeypot",
	"dotfiles",
	"social-presence",
	"automations",
	"dither-chat",
	"lander",
	"paper-mcp",
	"glasskit",
	"queue-bench",
	"slop-detector",
	"fluted",
	"overlay-ui",
];

export function seedGithubIntegration(now: number): GithubIntegration {
	const accounts: GithubAccount[] = [
		{
			id: "acc_vercel",
			login: "vercel",
			name: "Vercel",
			type: "Organization",
			avatarUrl: "https://github.com/vercel.png",
			repoAccess: "all",
			repoCount: VERCEL_REPOS.length,
			installedAt: new Date(now - DAY * 124).toISOString(),
		},
		{
			id: "acc_ripgrim",
			login: "ripgrim",
			name: "grim",
			type: "User",
			avatarUrl: "https://github.com/ripgrim.png",
			repoAccess: "selected",
			repoCount: RIPGRIM_REPOS.length,
			installedAt: new Date(now - DAY * 31).toISOString(),
		},
	];

	const make = (owner: string, name: string, i: number): ConnectedRepo => ({
		id: `repo_${owner}_${name}`,
		owner,
		name,
		fullName: `${owner}/${name}`,
		// A couple of private repos sprinkled in for the personal account.
		private: owner === "ripgrim" && (i === 2 || i === 3),
		pushedAt: new Date(
			now - (i === 0 ? HOUR * 0.5 : HOUR * 3 * i + DAY * (i % 5)),
		).toISOString(),
		openFlags: i % 6 === 0 ? (i % 4) + 1 : 0,
		stars: 0,
	});

	const repos: ConnectedRepo[] = [
		...VERCEL_REPOS.map((name, i) => make("vercel", name, i)),
		...RIPGRIM_REPOS.map((name, i) => make("ripgrim", name, i)),
	];

	return { accounts, repos, activeRepoId: "repo_ripgrim_tripwire" };
}
