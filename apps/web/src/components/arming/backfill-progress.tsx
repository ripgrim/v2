import { useQuery } from "@tanstack/react-query";
import { activeRepoQueryOptions } from "#/lib/onboarding.query";
import { cn } from "#/lib/utils";

/**
 * §4 — while an arm-time backfill replays stored change requests into runs, the
 * count climbs live and the dashboard fills in behind it. Polls only while a
 * backfill is in flight (non-null total); renders nothing otherwise.
 */
export function BackfillProgress({ className }: { className?: string }) {
	const { data: repo } = useQuery({
		...activeRepoQueryOptions(),
		refetchInterval: (query) =>
			query.state.data && query.state.data.backfillTotal !== null
				? 2000
				: false,
	});

	if (!repo || repo.backfillTotal === null) {
		return null;
	}
	const done = repo.backfillDone ?? 0;
	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-lg bg-surface-1 px-4 py-3",
				className,
			)}
		>
			<div className="size-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
			<p className="text-sm">
				backfilling — <span className="tabular-nums">{done}</span> of{" "}
				<span className="tabular-nums">{repo.backfillTotal}</span> change
				requests
			</p>
		</div>
	);
}
