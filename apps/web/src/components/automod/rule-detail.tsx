import {
	Cancel01Icon,
	Shield02Icon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CategoryPill } from "#/components/automod/category-pill";
import { Sparkline } from "#/components/charts/dither-kit";
import { useSidePanel } from "#/components/layouts/dashboard-side-panel";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import { automodRulesQueryOptions } from "#/lib/automod.query";
import type { AutomodMatch, AutomodRule } from "#/lib/automod.types";
import { getActionLabel, getCategoryConfig } from "#/lib/automod-category";
import { formatRelativeTime } from "#/lib/format-relative-time";
import { getItemTypeConfig } from "#/lib/item-type";
import { useAutomodActions } from "#/lib/use-automod-actions";
import { cn } from "#/lib/utils";

export function RuleDetail({ ruleId }: { ruleId: string }) {
	const { close } = useSidePanel();
	const { toggleRule } = useAutomodActions();
	const rulesQuery = useQuery(automodRulesQueryOptions());
	const rule = rulesQuery.data?.find((entry) => entry.id === ruleId);

	if (!rule) return null;

	const { icon: CategoryIcon } = getCategoryConfig(rule.category);
	const scope = rule.scope.length === 3 ? "All content" : rule.scope.join(", ");

	return (
		<div className="flex w-full flex-col overflow-hidden md:h-full md:w-80 md:rounded-xl md:border md:bg-card">
			<header className="flex items-center justify-between gap-2 px-4 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<CategoryIcon
						size={14}
						strokeWidth={2}
						className="shrink-0 text-muted-foreground"
					/>
					<span className="truncate text-xs font-medium text-muted-foreground">
						Automod rule
					</span>
				</div>
				<button
					type="button"
					onClick={close}
					aria-label="Close details"
					className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-1 hover:text-foreground"
				>
					<HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
				</button>
			</header>

			<Separator />

			<div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between gap-2">
						<CategoryPill category={rule.category} />
						<Switch
							checked={rule.enabled}
							onCheckedChange={() => toggleRule(rule)}
							aria-label={`${rule.enabled ? "Disable" : "Enable"} ${rule.name}`}
						/>
					</div>
					<h3 className="text-sm font-semibold leading-snug">{rule.name}</h3>
					<p className="text-xs leading-relaxed text-muted-foreground">
						{rule.description}
					</p>
				</div>

				<code className="block overflow-x-auto rounded-lg px-3 py-2 font-mono text-[11px] text-foreground">
					{rule.pattern}
				</code>

				<div className="rounded-lg p-3">
					<div className="flex items-end justify-between gap-3">
						<div>
							<p className="text-lg font-semibold tabular-nums leading-none">
								{rule.matches24h}
							</p>
							<p className="mt-1 text-[11px] text-muted-foreground">
								matches · 24h
							</p>
						</div>
						<div className="h-9 w-28">
							<Sparkline data={rule.trend} color="blue" bloom="aura" />
						</div>
					</div>
				</div>

				<dl className="flex flex-col gap-2.5 text-xs">
					<Field label="Scope">
						<span className="text-foreground">{scope}</span>
					</Field>
					<Field label="Action">
						<span className="text-foreground">
							{getActionLabel(rule.action)}
						</span>
					</Field>
					<Field label="False-positive rate">
						<span
							className={cn(
								"tabular-nums text-foreground",
								rule.falsePositiveRate >= 15 && "text-amber-500",
							)}
						>
							{rule.falsePositiveRate}%
						</span>
					</Field>
					<Field label="Last fired">
						<span className="text-foreground">
							{formatRelativeTime(rule.lastFiredAt)}
						</span>
					</Field>
				</dl>

				<div className="flex flex-col gap-2">
					<p className="text-xs font-medium text-muted-foreground">
						Recent matches
					</p>
					<div className="flex flex-col gap-2">
						{rule.recentMatches.map((match) => (
							<MatchCard key={match.id} rule={rule} match={match} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function MatchCard({
	rule,
	match,
}: {
	rule: AutomodRule;
	match: AutomodMatch;
}) {
	const { resolveMatch } = useAutomodActions();
	const { icon: TypeIcon } = getItemTypeConfig(match.type);
	const resolved = match.verdict !== "pending";

	const [org, repo] = match.repoFullName.split("/");
	const params = { org, repo, id: String(match.number) };
	const search = { c: match.commentId };

	const meta = (
		<>
			<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
				<TypeIcon size={12} strokeWidth={2} className="shrink-0" />
				<span className="truncate">
					{match.repoFullName} #{match.number}
				</span>
				<span aria-hidden>·</span>
				<span className="shrink-0">{formatRelativeTime(match.matchedAt)}</span>
			</div>
			<p className="line-clamp-2 text-xs text-foreground">{match.snippet}</p>
		</>
	);

	return (
		<div className="flex flex-col gap-2 rounded-lg p-2.5">
			{match.threadKind === "issue" ? (
				<Link
					to="/$org/$repo/issues/$id"
					params={params}
					search={search}
					className="-m-1 flex flex-col gap-1.5 rounded-md p-1 transition-colors hover:bg-surface-1"
				>
					{meta}
				</Link>
			) : (
				<Link
					to="/$org/$repo/pulls/$id"
					params={params}
					search={search}
					className="-m-1 flex flex-col gap-1.5 rounded-md p-1 transition-colors hover:bg-surface-1"
				>
					{meta}
				</Link>
			)}
			{resolved ? (
				<span className="inline-flex w-fit items-center gap-1.5 text-[11px] text-muted-foreground">
					<span
						className={cn(
							"size-1.5 rounded-full",
							match.verdict === "false-positive"
								? "bg-amber-500"
								: "bg-emerald-500",
						)}
						aria-hidden
					/>
					{match.verdict === "false-positive" ? "False positive" : "Confirmed"}
				</span>
			) : (
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => resolveMatch(rule, match, "confirmed")}
						className="inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-medium transition-colors hover:bg-surface-1"
					>
						<HugeiconsIcon icon={Tick01Icon} size={12} strokeWidth={2.25} />
						Confirm
					</button>
					<button
						type="button"
						onClick={() => resolveMatch(rule, match, "false-positive")}
						className="inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-surface-1 hover:text-foreground"
					>
						<HugeiconsIcon icon={Shield02Icon} size={12} strokeWidth={2.25} />
						False positive
					</button>
				</div>
			)}
		</div>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<dt className="text-muted-foreground">{label}</dt>
			<dd>{children}</dd>
		</div>
	);
}
