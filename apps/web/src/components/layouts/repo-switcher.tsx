import { GitBranchIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { armRepoById } from "#/lib/arm.functions";
import {
	chooseActiveRepo,
	type SwitcherRepo,
} from "#/lib/onboarding.functions";
import {
	activeRepoQueryOptions,
	onboardingQueryKeys,
	switcherReposQueryOptions,
} from "#/lib/onboarding.query";
import { cn } from "#/lib/utils";

/**
 * §4 repo switcher — scope stays one active repo; this changes which. Topbar
 * trigger + ⌘K palette, rows carrying SIGNAL (armed · pending · blocked-24h) so
 * it's triage, not navigation. Sorted by recent activity, grouped by owner; every
 * repo shows (search narrows a 400-repo org).
 */
export function RepoSwitcher() {
	const [open, setOpen] = useState(false);
	const { data: active } = useQuery(activeRepoQueryOptions());

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen((value) => !value);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<>
			<button
				className="flex h-8 min-w-0 max-w-[240px] items-center gap-2 rounded-md bg-surface-1 px-2.5 text-[13px] transition-colors hover:bg-surface-2"
				onClick={() => setOpen(true)}
				type="button"
			>
				<HugeiconsIcon
					className="shrink-0 text-muted-foreground"
					icon={GitBranchIcon}
					size={14}
					strokeWidth={2}
				/>
				<span className="min-w-0 truncate font-medium">
					{active ? active.fullName : "select a repo"}
				</span>
				<kbd className="ml-auto hidden shrink-0 rounded bg-background px-1 font-mono text-[10px] text-muted-foreground sm:block">
					⌘K
				</kbd>
			</button>
			{open ? (
				<SwitcherPalette
					activeId={active?.id ?? null}
					onClose={() => setOpen(false)}
				/>
			) : null}
		</>
	);
}

function SwitcherPalette({
	activeId,
	onClose,
}: {
	activeId: string | null;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const { data: repos } = useQuery(switcherReposQueryOptions());
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const choose = useMutation({
		mutationFn: (repoId: string) => chooseActiveRepo({ data: { repoId } }),
		onSettled: () => queryClient.invalidateQueries(),
		onSuccess: () => onClose(),
	});
	const arm = useMutation({
		mutationFn: (repoId: string) => armRepoById({ data: { repoId } }),
		onSettled: () =>
			queryClient.invalidateQueries({
				queryKey: onboardingQueryKeys.switcher(),
			}),
		onSuccess: (result) => {
			if (result.armed) {
				toast.success("armed — backfilling its history");
			}
		},
	});

	const groups = useMemo(() => {
		const term = query.trim().toLowerCase();
		const list = (repos ?? []).filter((repo) =>
			repo.fullName.toLowerCase().includes(term),
		);
		const byOwner = new Map<string, SwitcherRepo[]>();
		for (const repo of list) {
			const bucket = byOwner.get(repo.owner) ?? [];
			bucket.push(repo);
			byOwner.set(repo.owner, bucket);
		}
		return [...byOwner.entries()];
	}, [repos, query]);

	return (
		<div className="fixed inset-0 z-50">
			<button
				aria-label="close repo switcher"
				className="absolute inset-0 bg-background/60"
				onClick={onClose}
				type="button"
			/>
			<div
				aria-modal="true"
				className="-translate-x-1/2 absolute top-[12vh] left-1/2 w-full max-w-lg px-4"
				role="dialog"
			>
				<div className="overflow-hidden rounded-xl border bg-popover shadow-lg">
					<div className="flex items-center gap-2 border-b px-3">
						<HugeiconsIcon
							className="shrink-0 text-muted-foreground"
							icon={Search01Icon}
							size={16}
							strokeWidth={2}
						/>
						<input
							className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
							onChange={(event) => setQuery(event.target.value)}
							placeholder="search repos…"
							ref={inputRef}
							value={query}
						/>
					</div>

					<div className="max-h-[50vh] overflow-y-auto py-1">
						{groups.length === 0 ? (
							<p className="px-4 py-6 text-center text-muted-foreground text-sm">
								no repos match.
							</p>
						) : (
							groups.map(([owner, ownerRepos]) => (
								<div key={owner}>
									<div className="px-3 py-1.5 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
										{owner}
									</div>
									{ownerRepos.map((repo) => (
										<RepoOption
											active={repo.id === activeId}
											arming={arm.isPending && arm.variables === repo.id}
											key={repo.id}
											onArm={() => arm.mutate(repo.id)}
											onChoose={() => choose.mutate(repo.id)}
											repo={repo}
										/>
									))}
								</div>
							))
						)}
					</div>

					<div className="flex items-center justify-between border-t px-3 py-2 text-muted-foreground text-xs">
						<span>
							{groups.reduce((sum, [, list]) => sum + list.length, 0)} repos
						</span>
						<span className="font-mono">⌘K</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "red" }) {
	return (
		<span
			className={cn(
				"shrink-0 rounded-full px-1.5 py-0.5 text-[11px]",
				tone === "red"
					? "bg-red-500/10 text-red-600 dark:text-red-400"
					: "bg-surface-2 text-muted-foreground",
			)}
		>
			{children}
		</span>
	);
}

function RepoOption({
	repo,
	active,
	arming,
	onChoose,
	onArm,
}: {
	repo: SwitcherRepo;
	active: boolean;
	arming: boolean;
	onChoose: () => void;
	onArm: () => void;
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-2 px-3 py-2 text-sm transition-colors",
				active ? "bg-surface-1" : "hover:bg-surface-1",
			)}
		>
			<button
				className="flex min-w-0 flex-1 items-center gap-2 text-left"
				onClick={onChoose}
				type="button"
			>
				<span
					className={cn(
						"size-1.5 shrink-0 rounded-full",
						repo.armed ? "bg-emerald-500" : "bg-muted-foreground/30",
					)}
					title={repo.armed ? "armed" : "not armed"}
				/>
				<span className="min-w-0 truncate font-medium">{repo.name}</span>
				{repo.pendingModeration > 0 ? (
					<Chip>{repo.pendingModeration} pending</Chip>
				) : null}
				{repo.blocked24h > 0 ? (
					<Chip tone="red">{repo.blocked24h} blocked</Chip>
				) : null}
			</button>
			{repo.armed ? (
				active ? (
					<span className="shrink-0 text-muted-foreground text-xs">
						current
					</span>
				) : null
			) : (
				<button
					className="shrink-0 rounded-md bg-foreground px-2 py-0.5 font-medium text-background text-xs disabled:opacity-50"
					disabled={arming}
					onClick={onArm}
					type="button"
				>
					{arming ? "arming…" : "arm"}
				</button>
			)}
		</div>
	);
}
