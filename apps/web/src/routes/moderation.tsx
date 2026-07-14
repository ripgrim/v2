import { createFileRoute } from "@tanstack/react-router";
import { ModerationPage } from "#/components/moderation/moderation-page";
import { moderationQueueOptions } from "#/components/moderation/moderation-queue";
import { moderationStatsQueryOptions } from "#/lib/moderation.query";

/**
 * The SCOPED moderation queue for the active repo (§4). Home ("/") went
 * cross-repo; this is where triage lives now.
 */
export const Route = createFileRoute("/moderation")({
	ssr: false,
	loader: ({ context }) => {
		void context.queryClient.prefetchQuery(moderationQueueOptions());
		void context.queryClient.prefetchQuery(moderationStatsQueryOptions());
	},
	component: ModerationPage,
});
