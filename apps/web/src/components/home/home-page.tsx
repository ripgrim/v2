import { GitBranchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";
import {
	chooseActiveRepo,
	type SwitcherRepo,
} from "#/lib/onboarding.functions";
import { switcherReposQueryOptions } from "#/lib/onboarding.query";
import { cn } from "#/lib/utils";

/**
 * §4 — HOME is the ONLY cross-repo page. Scope has one weakness (you're inside
 * dither-kit while scratch has items waiting and can't see it); this fixes it at
 * the front door: a summary across your repos + a per-repo breakdown ranked by
 * what needs attention. Clicking a repo SCOPES INTO IT — every other surface
 * stays scoped to the active repo.
 */
export function HomePage() {
	const { data: repos, error } = useQuery(switcherReposQueryOptions());
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const scope = useMutation({
		mutationFn: (repoId: string) => chooseActiveRepo({ data: { repoId } }),
		onSuccess: async () => {
			await queryClient.invalidateQueries();
			navigate({ to: "/moderation" });
		},
	});

	const ranked = useMemo(() => {
		return [...(repos ?? [])].sort(
			(a, b) =>
				b.pendingModeration - a.pendingModeration ||
				b.blocked24h - a.blocked24h ||
				(b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""),
		);
	}, [repos]);

	if (error) {
		throw error;
	}

	const awaiting = ranked.reduce((sum, r) => sum + r.pendingModeration, 0);
	const blocked = ranked.reduce((sum, r) => sum + r.blocked24h, 0);

	return (
		<DashboardLayout counts={{ queue: awaiting || undefined }}>
			<div className="px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
					<header className="flex flex-col gap-1.5">
						<h1 className="font-semibold text-2xl tracking-tight">Home</h1>
						<p className="text-muted-foreground text-sm">
							across your repos —{" "}
							<span className="font-medium text-foreground tabular-nums">
								{awaiting}
							</span>{" "}
							awaiting your decision,{" "}
							<span className="font-medium text-foreground tabular-nums">
								{blocked}
							</span>{" "}
							blocked today.
						</p>
					</header>

					{repos ? (
						<div className="flex flex-col gap-1">
							{ranked.map((repo) => (
								<RepoRow
									key={repo.id}
									onScope={() => scope.mutate(repo.id)}
									repo={repo}
								/>
							))}
						</div>
					) : (
						<HomeListSkeleton />
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}

function RepoRow({
	repo,
	onScope,
}: {
	repo: SwitcherRepo;
	onScope: () => void;
}) {
	return (
		<button
			className="flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-surface-1"
			onClick={onScope}
			type="button"
		>
			<HugeiconsIcon
				className="shrink-0 text-muted-foreground"
				icon={GitBranchIcon}
				size={16}
				strokeWidth={1.8}
			/>
			<div className="min-w-0 flex-1">
				<div className="truncate font-medium text-sm">{repo.fullName}</div>
				<div className="text-muted-foreground text-xs">
					{repo.armed ? attentionLine(repo) : "available — not armed"}
				</div>
			</div>
			{repo.armed ? (
				<div className="flex shrink-0 items-center gap-2">
					{repo.pendingModeration > 0 ? (
						<Chip tone="amber">{repo.pendingModeration} awaiting</Chip>
					) : null}
					{repo.blocked24h > 0 ? (
						<Chip tone="red">{repo.blocked24h} blocked</Chip>
					) : null}
				</div>
			) : (
				<span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-muted-foreground text-xs">
					not armed
				</span>
			)}
		</button>
	);
}

function attentionLine(repo: SwitcherRepo): string {
	if (repo.pendingModeration > 0) {
		return "needs your decision";
	}
	if (repo.blocked24h > 0) {
		return "blocking change requests today";
	}
	return "watching — nothing waiting";
}

function Chip({
	children,
	tone,
}: {
	children: React.ReactNode;
	tone: "amber" | "red";
}) {
	return (
		<span
			className={cn(
				"shrink-0 rounded-full px-2 py-0.5 font-medium text-xs",
				tone === "red"
					? "bg-red-500/10 text-red-600 dark:text-red-400"
					: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
			)}
		>
			{children}
		</span>
	);
}

function HomeListSkeleton() {
	return (
		<div className="flex flex-col gap-1">
			{["a", "b", "c", "d", "e"].map((slot) => (
				<Skeleton className="h-14 rounded-lg" key={slot} />
			))}
		</div>
	);
}
