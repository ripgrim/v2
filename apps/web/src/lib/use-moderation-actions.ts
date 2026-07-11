import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSidePanel } from "#/components/layouts/dashboard-side-panel";
import { toast } from "#/components/ui/sonner";
import { moderationQueueQueryOptions } from "#/lib/moderation.query";
import type { FlaggedItem, ModerationAction } from "#/lib/moderation.types";

const MESSAGES: Record<ModerationAction, (item: FlaggedItem) => string> = {
	approve: (item) =>
		`Dismissed report on ${item.repository.fullName} #${item.number}`,
	remove: (item) => `Removed ${item.repository.fullName} #${item.number}`,
	ban: (item) => `Banned @${item.author.login}`,
};

/**
 * Resolves a flagged item by optimistically dropping it from the cached queue
 * and surfacing a toast. No backend round-trip — the mock store is the cache.
 */
export function useModerationActions() {
	const queryClient = useQueryClient();
	const { activeKey, close } = useSidePanel();

	const act = useCallback(
		(item: FlaggedItem, action: ModerationAction) => {
			const { queryKey } = moderationQueueQueryOptions();
			queryClient.setQueryData<FlaggedItem[]>(queryKey, (prev) =>
				(prev ?? []).filter((entry) => entry.id !== item.id),
			);

			if (activeKey === item.id) {
				close();
			}

			toast.success(MESSAGES[action](item), {
				description:
					action === "ban"
						? "The author was banned from the organization."
						: undefined,
			});
		},
		[queryClient, activeKey, close],
	);

	return { act };
}
