import { queryOptions, useQueryClient } from "@tanstack/react-query";
import type { NormalizedEvent } from "@tripwire/contracts";
import { useEffect } from "react";
import {
	type ActivityItem,
	type ActivityPageData,
	getActivity,
} from "#/lib/activity.functions";

export const activityQueryKeys = {
	all: ["activity"] as const,
	list: () => [...activityQueryKeys.all, "live"] as const,
};

export const activityQueryOptions = () =>
	queryOptions({
		queryKey: activityQueryKeys.list(),
		queryFn: ({ signal }) => getActivity({ data: {}, signal }),
		staleTime: 30_000,
		gcTime: 5 * 60_000,
	});

const MAX_LIVE_ITEMS = 200;

/** A change-request event drives the gate — its row starts as "evaluating…". */
function isGated(event: NormalizedEvent): boolean {
	return event.kind.startsWith("change-request.");
}

/**
 * §9 — the SSE stream merges into the Query cache (not a parallel state system).
 * Two message kinds: `event` prepends a new row (optimistically "evaluating…"
 * for a gated change request); `run` RESOLVES the matching row in place with
 * its joined run + verdict — never appends a second row. Live rows land in the
 * cache regardless of the active filter chip; the view filters the cache.
 */
export function useActivityStream(enabled = true): void {
	const queryClient = useQueryClient();
	useEffect(() => {
		if (!enabled) {
			return;
		}
		const source = new EventSource("/api/events/stream");

		source.addEventListener("event", (message) => {
			const event = JSON.parse(message.data) as NormalizedEvent;
			queryClient.setQueryData<ActivityPageData>(
				activityQueryKeys.list(),
				(current) => {
					const incoming: ActivityItem = {
						event,
						run: null,
						pending: isGated(event),
					};
					if (!current) {
						return { items: [incoming], nextCursor: null };
					}
					if (current.items.some((item) => item.event.id === event.id)) {
						return current;
					}
					return {
						...current,
						items: [incoming, ...current.items].slice(0, MAX_LIVE_ITEMS),
					};
				},
			);
		});

		source.addEventListener("run", (message) => {
			const resolved = JSON.parse(message.data) as ActivityItem;
			queryClient.setQueryData<ActivityPageData>(
				activityQueryKeys.list(),
				(current) => {
					if (!current) {
						return { items: [resolved], nextCursor: null };
					}
					const exists = current.items.some(
						(item) => item.event.id === resolved.event.id,
					);
					return {
						...current,
						items: exists
							? current.items.map((item) =>
									item.event.id === resolved.event.id
										? { ...resolved, pending: false }
										: item,
								)
							: [{ ...resolved, pending: false }, ...current.items].slice(
									0,
									MAX_LIVE_ITEMS,
								),
					};
				},
			);
		});

		return () => source.close();
	}, [enabled, queryClient]);
}
