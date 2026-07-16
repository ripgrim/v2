import { createServerFn } from "@tanstack/react-start";
import {
	type ActivityFeed,
	type ActivityFeedItem,
	type ActivityGroup,
	type ActivityRunSummary,
	type ActivityTimelineEntry,
	activityFeedSchema,
} from "@tripwire/contracts";
import { accessGuardMiddleware } from "#/lib/server/gated-server-fn";

// The wire shapes live in @tripwire/contracts (one home, validated). Re-exported
// here under the names the /activity components already use.
export type ActivityRun = ActivityRunSummary;
export type ActivityItem = ActivityTimelineEntry;
export type { ActivityFeedItem, ActivityGroup };
export type ActivityFeedData = ActivityFeed;

export const getActivityFeed = createServerFn({ method: "GET" })
	.middleware([accessGuardMiddleware])
	.handler(async (): Promise<ActivityFeedData> => {
		const { getActiveRepo } = await import("#/lib/server/active-repo");
		const repo = await getActiveRepo();
		if (!repo) {
			return { items: [] };
		}
		const { eventServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		const feed = await eventServices.listActivityFeed(getDb().db, {
			repoFullName: repo.fullName,
			limit: 50,
		});
		// Parse at the boundary: a shape mismatch (a drifted normalized event, a
		// mistyped timestamp) fails loudly HERE, never inside a downstream render.
		return activityFeedSchema.parse(feed);
	});
