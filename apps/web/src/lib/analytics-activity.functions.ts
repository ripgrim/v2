import { createServerFn } from "@tanstack/react-start";
import type { AnalyticsEvent } from "#/lib/analytics-events";

/**
 * Real activity behind a moderation metric — the list under the chart on
 * `/analytics`. Each metric surfaces the runs/decisions that actually moved
 * its line, built from the runs + moderation_items tables (the same sources
 * the chart series come from), so chart and activity tell one story.
 */

function subject(repoFullName: string, subjectNumber: number | null): string {
	return subjectNumber ? `${repoFullName} #${subjectNumber}` : repoFullName;
}

export const getAnalyticsActivity = createServerFn({ method: "GET" })
	.inputValidator((input: { metric: string }) => input)
	.handler(async ({ data }): Promise<AnalyticsEvent[]> => {
		const { insightServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		const { db } = getDb();

		if (data.metric === "resolved") {
			const decisions = await insightServices.listRecentDecisions(db);
			return decisions.map((d) => ({
				id: d.itemId,
				kind: "resolve",
				title:
					d.status === "approved" ? "approved a change" : "denied a change",
				detail: subject(d.repoFullName, d.subjectNumber),
				at: (d.decidedAt ?? new Date(0)).toISOString(),
				impact: {
					label: d.status,
					tone: d.status === "approved" ? "down" : "up",
				},
			}));
		}

		if (data.metric === "automod") {
			const runs = await insightServices.listRecentRuns(db, {
				verdicts: ["block"],
			});
			return runs.map((r) => ({
				id: r.runId,
				kind: "ban",
				title: r.actorLogin ? `blocked ${r.actorLogin}` : "blocked a change",
				detail: subject(r.repoFullName, r.subjectNumber),
				at: r.createdAt.toISOString(),
				impact: {
					label: `${r.failedCount} of ${r.ruleCount} tripped`,
					tone: "up",
				},
			}));
		}

		if (data.metric === "banned") {
			return [];
		}

		// "pending" (default): runs awaiting a maintainer.
		const runs = await insightServices.listRecentRuns(db, {
			verdicts: ["needs_review"],
		});
		return runs.map((r) => ({
			id: r.runId,
			kind: "report",
			title: r.actorLogin ? `${r.actorLogin} sent to review` : "sent to review",
			detail: subject(r.repoFullName, r.subjectNumber),
			at: r.createdAt.toISOString(),
			impact: { label: "awaiting review", tone: "neutral" },
		}));
	});
