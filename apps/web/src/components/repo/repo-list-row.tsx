import { Link } from "@tanstack/react-router";
import { CircleDot, GitPullRequest, Lock, ShieldAlert } from "lucide-react";
import type { RepoSummary } from "#/lib/repo-content.types";

/** One repo in the org repos list — links to the repo's analytics overview. */
export function RepoListRow({ org, repo }: { org: string; repo: RepoSummary }) {
	return (
		<Link
			to="/$org/$repo/analytics"
			params={{ org, repo: repo.name }}
			className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2"
		>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-center gap-1.5">
					<span className="font-medium text-[13px] text-foreground transition-colors group-hover:text-brand">
						{repo.name}
					</span>
					{repo.visibility === "private" ? (
						<Lock size={11} strokeWidth={2} className="text-muted-foreground" />
					) : null}
				</div>
				<p className="truncate text-[12px] text-muted-foreground">
					{repo.description}
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-3.5 text-[12px] text-muted-foreground tabular-nums">
				<span className="flex items-center gap-1">
					<CircleDot size={13} strokeWidth={2} />
					{repo.openIssues}
				</span>
				<span className="flex items-center gap-1">
					<GitPullRequest size={13} strokeWidth={2} />
					{repo.openPulls}
				</span>
				{repo.flagged > 0 ? (
					<span className="flex items-center gap-1 text-red-400">
						<ShieldAlert size={13} strokeWidth={2} />
						{repo.flagged}
					</span>
				) : null}
			</div>
		</Link>
	);
}
