import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { BarChart3, CircleDot, GitPullRequest } from "lucide-react";

type Tab = "analytics" | "issues" | "pulls";

/** Repo-scoped sub-nav so every repo route is reachable from any other. */
export function RepoTabs({
	org,
	repo,
	active,
}: {
	org: string;
	repo: string;
	active: Tab;
}) {
	return (
		<div className="flex items-center gap-1 border-border border-b">
			<RepoTab
				to="/$org/$repo/analytics"
				org={org}
				repo={repo}
				label="Analytics"
				icon={BarChart3}
				active={active === "analytics"}
			/>
			<RepoTab
				to="/$org/$repo/issues"
				org={org}
				repo={repo}
				label="Issues"
				icon={CircleDot}
				active={active === "issues"}
			/>
			<RepoTab
				to="/$org/$repo/pulls"
				org={org}
				repo={repo}
				label="Pulls"
				icon={GitPullRequest}
				active={active === "pulls"}
			/>
		</div>
	);
}

function RepoTab({
	to,
	org,
	repo,
	label,
	icon: Icon,
	active,
}: {
	to: "/$org/$repo/analytics" | "/$org/$repo/issues" | "/$org/$repo/pulls";
	org: string;
	repo: string;
	label: string;
	icon: LucideIcon;
	active: boolean;
}) {
	return (
		<Link
			to={to}
			params={{ org, repo }}
			className={
				active
					? "-mb-px flex items-center gap-1.5 border-foreground border-b-2 px-2.5 pb-2.5 font-medium text-[13px] text-foreground"
					: "-mb-px flex items-center gap-1.5 border-transparent border-b-2 px-2.5 pb-2.5 font-medium text-[13px] text-muted-foreground transition-colors hover:text-foreground"
			}
		>
			<Icon size={14} strokeWidth={2} />
			{label}
		</Link>
	);
}
