import {
	ActivityIcon,
	CheckListIcon,
	FlowIcon,
	GitBranchIcon,
	Home01Icon,
	Logout01Icon,
	Queue01Icon,
	SecurityIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Command as CommandPrimitive } from "cmdk";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	armRepoById,
	disarmActiveRepo,
	armActiveRepo as fnArmActive,
} from "#/lib/arm.functions";
import { authClient } from "#/lib/auth-client";
import {
	chooseActiveRepo,
	type SwitcherRepo,
} from "#/lib/onboarding.functions";
import {
	activeRepoQueryOptions,
	switcherReposQueryOptions,
} from "#/lib/onboarding.query";
import { latestRunQueryOptions } from "#/lib/runs.query";
import { cn } from "#/lib/utils";

/**
 * §4 command palette — opens on ⌘K / "/", the ONE keyboard surface for the app.
 * Repos (the switcher, now carrying signal), actions (arm/disarm, jump, sign
 * out), and navigation, all fuzzy-searchable by alternate names. Built on cmdk
 * for real keyboard semantics; the trigger + active-repo scoping are unchanged.
 */
export function RepoSwitcher() {
	const [open, setOpen] = useState(false);
	const { data: active } = useQuery(activeRepoQueryOptions());

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen((value) => !value);
				return;
			}
			// "/" is a global open, but not while the user is typing somewhere.
			if (event.key === "/" && !open && !isTypingTarget(event.target)) {
				event.preventDefault();
				setOpen(true);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

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
			{open ? <CommandPalette onClose={() => setOpen(false)} /> : null}
		</>
	);
}

/** True when focus is in a field, so "/" types a slash instead of opening. */
function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) {
		return false;
	}
	const tag = target.tagName;
	return (
		tag === "INPUT" ||
		tag === "TEXTAREA" ||
		tag === "SELECT" ||
		target.isContentEditable
	);
}

interface PaletteItem {
	id: string;
	label: string;
	/** Alternate names so nothing needs to be typed verbatim. */
	searchTags: string[];
	icon: IconSvgElement;
	hint?: React.ReactNode;
	onSelect: () => void;
}

function CommandPalette({ onClose }: { onClose: () => void }) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	// Mounted only while open ⇒ these fetch on open, not on app mount.
	const { data: repos } = useQuery(switcherReposQueryOptions());
	const { data: active } = useQuery(activeRepoQueryOptions());
	const { data: latestRunId } = useQuery(latestRunQueryOptions());

	const [query, setQuery] = useState("");
	const deferred = useDebouncedValue(query, 200);
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

	const invalidate = () => queryClient.invalidateQueries();

	const choose = useMutation({
		mutationFn: (repoId: string) => chooseActiveRepo({ data: { repoId } }),
		onSettled: invalidate,
		onSuccess: onClose,
	});
	const armRepo = useMutation({
		mutationFn: (repoId: string) => armRepoById({ data: { repoId } }),
		onSettled: invalidate,
		onSuccess: (result) => {
			if (result.armed) {
				toast.success("armed — backfilling its history");
			}
		},
	});
	const armActive = useMutation({
		mutationFn: () => fnArmActive(),
		onSettled: invalidate,
		onSuccess: (result) => {
			if (result.armed) {
				toast.success("armed — backfilling its history");
			}
		},
	});
	const disarmActive = useMutation({
		mutationFn: () => disarmActiveRepo(),
		onSettled: invalidate,
		onSuccess: () => toast.success("disarmed — events still ingest, gate off"),
	});

	function go(path: string) {
		navigate({ to: path });
		onClose();
	}

	// ── REPOS: sorted by recent activity, grouped by owner ─────────────────────
	const repoGroups = useMemo(() => {
		const terms = tokenize(deferred);
		const sorted = [...(repos ?? [])].sort(
			(a, b) => activityRank(b) - activityRank(a),
		);
		const byOwner = new Map<string, PaletteItem[]>();
		for (const repo of sorted) {
			const item = repoItem(repo, active?.id ?? null, {
				scope: () => choose.mutate(repo.id),
				arm: () => armRepo.mutate(repo.id),
				arming: armRepo.isPending && armRepo.variables === repo.id,
			});
			if (!matches(item, terms)) {
				continue;
			}
			const bucket = byOwner.get(repo.owner) ?? [];
			bucket.push(item);
			byOwner.set(repo.owner, bucket);
		}
		return [...byOwner.entries()];
	}, [repos, active?.id, deferred, choose, armRepo]);

	// ── ACTIONS (cheap to build; not memoized so closures stay fresh) ───────────
	const actionItems: PaletteItem[] = [];
	if (active) {
		actionItems.push(
			active.armed
				? {
						id: "action:disarm",
						label: `disarm ${active.name}`,
						searchTags: ["disarm", "off", "stop", "gate", active.fullName],
						icon: SecurityIcon,
						onSelect: () => disarmActive.mutate(),
					}
				: {
						id: "action:arm",
						label: `arm ${active.name}`,
						searchTags: ["arm", "on", "enable", "gate", active.fullName],
						icon: SecurityIcon,
						onSelect: () => armActive.mutate(),
					},
		);
	}
	if (latestRunId) {
		actionItems.push({
			id: "action:latest-run",
			label: "open latest run",
			searchTags: ["run", "latest", "verdict", "result", "jump"],
			icon: ActivityIcon,
			onSelect: () => go(`/runs/${latestRunId}`),
		});
	}
	actionItems.push({
		id: "action:sign-out",
		label: "sign out",
		searchTags: ["sign out", "log out", "logout", "leave"],
		icon: Logout01Icon,
		onSelect: () =>
			authClient.signOut({
				fetchOptions: { onSuccess: () => window.location.assign("/login") },
			}),
	});

	// ── NAVIGATION ──────────────────────────────────────────────────────────────
	const navItems: PaletteItem[] = [
		{
			id: "nav:home",
			label: "Home",
			searchTags: ["home", "overview", "dashboard", "repos"],
			icon: Home01Icon,
			onSelect: () => go("/"),
		},
		{
			id: "nav:moderation",
			label: "Moderation",
			searchTags: ["moderation", "queue", "review", "pending", "triage"],
			icon: Queue01Icon,
			onSelect: () => go("/moderation"),
		},
		{
			id: "nav:activity",
			label: "Activity",
			searchTags: ["activity", "events", "runs", "feed", "stream"],
			icon: ActivityIcon,
			onSelect: () => go("/activity"),
		},
		{
			id: "nav:rules",
			label: "Rules",
			searchTags: ["rules", "gate", "block", "checks", "gatekeeper"],
			icon: CheckListIcon,
			onSelect: () => go("/rules"),
		},
		{
			id: "nav:workflows",
			label: "Workflows",
			searchTags: ["workflows", "automation", "pipeline", "dag"],
			icon: FlowIcon,
			onSelect: () => go("/workflows"),
		},
	];

	const terms = tokenize(deferred);
	const visibleActions = actionItems.filter((item) => matches(item, terms));
	const visibleNav = navItems.filter((item) => matches(item, terms));
	const resultCount =
		repoGroups.reduce((sum, [, list]) => sum + list.length, 0) +
		visibleActions.length +
		visibleNav.length;

	return (
		<div className="fixed inset-0 z-50">
			<button
				aria-label="close command palette"
				className="absolute inset-0 bg-background/60"
				onClick={onClose}
				type="button"
			/>
			<div
				aria-modal="true"
				className="-translate-x-1/2 absolute top-[12vh] left-1/2 w-full max-w-lg px-4"
				role="dialog"
			>
				<CommandPrimitive
					className="overflow-hidden rounded-xl border bg-popover shadow-lg [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
					label="Command palette"
					loop
					shouldFilter={false}
				>
					<div className="flex items-center gap-2 border-b px-3">
						<HugeiconsIcon
							className="shrink-0 text-muted-foreground"
							icon={GitBranchIcon}
							size={16}
							strokeWidth={2}
						/>
						<CommandPrimitive.Input
							className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
							onValueChange={setQuery}
							placeholder="search repos, actions, pages…"
							ref={inputRef}
							value={query}
						/>
					</div>

					<CommandPrimitive.List className="max-h-[50vh] overflow-y-auto py-1">
						<CommandPrimitive.Empty className="px-4 py-6 text-center text-muted-foreground text-sm">
							nothing matches.
						</CommandPrimitive.Empty>

						{repoGroups.map(([owner, items]) => (
							<CommandPrimitive.Group heading={owner} key={owner}>
								{items.map((item) => (
									<PaletteRow item={item} key={item.id} />
								))}
							</CommandPrimitive.Group>
						))}

						{visibleActions.length > 0 ? (
							<CommandPrimitive.Group heading="Actions">
								{visibleActions.map((item) => (
									<PaletteRow item={item} key={item.id} />
								))}
							</CommandPrimitive.Group>
						) : null}

						{visibleNav.length > 0 ? (
							<CommandPrimitive.Group heading="Navigation">
								{visibleNav.map((item) => (
									<PaletteRow item={item} key={item.id} />
								))}
							</CommandPrimitive.Group>
						) : null}
					</CommandPrimitive.List>

					<div className="flex items-center justify-between border-t px-3 py-2 text-muted-foreground text-[11px]">
						<span className="flex items-center gap-3">
							<span>
								<kbd className="font-mono">↑↓</kbd> navigate
							</span>
							<span>
								<kbd className="font-mono">↵</kbd> select
							</span>
							<span>
								<kbd className="font-mono">esc</kbd> close
							</span>
						</span>
						<span className="tabular-nums">{resultCount} results</span>
					</div>
				</CommandPrimitive>
			</div>
		</div>
	);
}

function PaletteRow({ item }: { item: PaletteItem }) {
	return (
		<CommandPrimitive.Item
			className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-surface-1"
			onSelect={item.onSelect}
			value={item.id}
		>
			<HugeiconsIcon
				className="shrink-0 text-muted-foreground"
				icon={item.icon}
				size={15}
				strokeWidth={1.9}
			/>
			<span className="min-w-0 flex-1 truncate">{item.label}</span>
			{item.hint ? (
				<span className="flex shrink-0 items-center gap-1.5">{item.hint}</span>
			) : null}
		</CommandPrimitive.Item>
	);
}

function repoItem(
	repo: SwitcherRepo,
	activeId: string | null,
	handlers: { scope: () => void; arm: () => void; arming: boolean },
): PaletteItem {
	const isActive = repo.id === activeId;
	return {
		id: `repo:${repo.id}`,
		label: repo.name,
		searchTags: [
			repo.owner,
			repo.name,
			repo.fullName,
			repo.armed ? "armed" : "unarmed not armed arm",
			isActive ? "current active" : "",
		],
		icon: GitBranchIcon,
		// Armed ⇒ scope into it. Unarmed ⇒ arm it — never silently scope a dead repo.
		onSelect: repo.armed ? handlers.scope : handlers.arm,
		hint: (
			<>
				<span
					className={cn(
						"size-1.5 rounded-full",
						repo.armed ? "bg-emerald-500" : "bg-muted-foreground/30",
					)}
					title={repo.armed ? "armed" : "not armed"}
				/>
				{repo.pendingModeration > 0 ? (
					<RowChip>{repo.pendingModeration} pending</RowChip>
				) : null}
				{repo.blocked24h > 0 ? (
					<RowChip tone="red">{repo.blocked24h} blocked</RowChip>
				) : null}
				{repo.armed ? (
					isActive ? (
						<span className="text-muted-foreground text-xs">current</span>
					) : null
				) : (
					<span className="text-muted-foreground text-xs">
						{handlers.arming ? "arming…" : "↵ to arm"}
					</span>
				)}
			</>
		),
	};
}

function RowChip({
	children,
	tone,
}: {
	children: React.ReactNode;
	tone?: "red";
}) {
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

/** Multi-word AND: every term must appear in the item's searchable string. */
function matches(item: PaletteItem, terms: string[]): boolean {
	if (terms.length === 0) {
		return true;
	}
	const hay = `${item.label} ${item.searchTags.join(" ")}`.toLowerCase();
	return terms.every((term) => hay.includes(term));
}

function tokenize(query: string): string[] {
	return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

/** Most-recent activity first; repos that never fired sink to the bottom. */
function activityRank(repo: SwitcherRepo): number {
	return repo.lastActivityAt ? Date.parse(repo.lastActivityAt) : 0;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(timer);
	}, [value, delayMs]);
	return debounced;
}
