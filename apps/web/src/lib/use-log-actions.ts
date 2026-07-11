import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "#/components/ui/sonner";
import { moderationLogQueryOptions } from "#/lib/log.query";
import type { LogEntry } from "#/lib/log.types";
import { MODERATOR } from "#/lib/site-config";

// In this mock the signed-in moderator is a lead, so undo is permitted.
export const VIEWER_IS_LEAD = true;

/**
 * Optimistic log mutations. The log query is the source of truth; undo and
 * batch resolution rewrite the cached entry (append-only history) — no backend.
 */
export function useLogActions() {
	const queryClient = useQueryClient();
	const { queryKey } = moderationLogQueryOptions();

	const patch = useCallback(
		(id: string, update: (entry: LogEntry) => LogEntry) => {
			queryClient.setQueryData<LogEntry[]>(queryKey, (prev) =>
				(prev ?? []).map((entry) => (entry.id === id ? update(entry) : entry)),
			);
		},
		[queryClient, queryKey],
	);

	/** Reverse an action — leads only, requires a reason. */
	const undo = useCallback(
		(entry: LogEntry, reason: string) => {
			patch(entry.id, (e) => ({
				...e,
				status: "reversed",
				history: [
					...e.history,
					{
						at: new Date().toISOString(),
						label: `Reversed — ${reason}`,
						by: MODERATOR.login,
					},
				],
			}));
			toast.success(`Reversed · ${entry.label}`, {
				description: "Content restored and logged.",
			});
		},
		[patch],
	);

	/** Action a subset of a bundle, sparing the unchecked items. */
	const resolveBundle = useCallback(
		(entry: LogEntry, keptIds: Set<string>) => {
			const hit = entry.items.length - keptIds.size;
			patch(entry.id, (e) => ({
				...e,
				items: e.items.filter((item) => keptIds.has(item.id)),
				status: "actioned",
			}));
			toast.success(
				`Removed ${hit} item${hit === 1 ? "" : "s"}` +
					(keptIds.size ? `, spared ${keptIds.size}` : ""),
			);
		},
		[patch],
	);

	return { undo, resolveBundle };
}
