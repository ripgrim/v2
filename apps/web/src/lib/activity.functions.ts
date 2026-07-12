import { createServerFn } from "@tanstack/react-start";
import type { NormalizedEvent } from "@tripwire/contracts";

/** A run as the /activity feed shows it — verdict + leading reason. */
export interface ActivityRun {
	runId: string;
	verdict: string | null;
	status: string;
	/** The first failing rule's plain-English one-liner (§10), when blocked. */
	reason: string | null;
}

export interface ActivityItem {
	event: NormalizedEvent;
	run: ActivityRun | null;
	/** Client-only: a change-request event still evaluating (optimistic live row). */
	pending?: boolean;
}

export interface ActivityPageData {
	items: ActivityItem[];
	nextCursor: string | null;
}

export const getActivity = createServerFn({ method: "GET" })
	.inputValidator((input: { cursor?: string } = {}) => input)
	.handler(async ({ data }): Promise<ActivityPageData> => {
		const { requireSession } = await import("#/lib/server/session");
		await requireSession();
		const { eventServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		const page = await eventServices.listActivity(getDb().db, {
			cursor: data.cursor,
			limit: 50,
		});
		return { items: page.items as ActivityItem[], nextCursor: page.nextCursor };
	});
