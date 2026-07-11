import type { ModStats } from "@tripwire/contracts";
import { generateId } from "@tripwire/utils";
import { sql } from "drizzle-orm";
import type { Db } from "../client.ts";

/**
 * Rollups + Home stats (§4). `computeDailyRollups` is the worker's daily job;
 * `getHomeStats` feeds the Home stat cards with REAL data in the demo's
 * ModStats contract shape (value, signed delta, 24h hourly series).
 */

export async function computeDailyRollups(db: Db, day: string): Promise<void> {
	await db.execute(sql`
		INSERT INTO rollups_daily (id, repo_id, day, events, runs, passed, blocked, sent_to_review)
		SELECT
			${generateId()} || substr(md5(r.id), 1, 8),
			r.id,
			${day}::date,
			COALESCE(e.n, 0),
			COALESCE(x.n, 0),
			COALESCE(x.passed, 0),
			COALESCE(x.blocked, 0),
			COALESCE(x.review, 0)
		FROM repos r
		LEFT JOIN (
			SELECT repo_full_name, count(*)::int AS n
			FROM events
			WHERE received_at::date = ${day}::date
			GROUP BY repo_full_name
		) e ON e.repo_full_name = r.full_name
		LEFT JOIN (
			SELECT repo_full_name,
				count(*)::int AS n,
				count(*) FILTER (WHERE verdict = 'pass')::int AS passed,
				count(*) FILTER (WHERE verdict = 'block')::int AS blocked,
				count(*) FILTER (WHERE verdict = 'needs_review')::int AS review
			FROM runs
			WHERE created_at::date = ${day}::date
			GROUP BY repo_full_name
		) x ON x.repo_full_name = r.full_name
		ON CONFLICT (repo_id, day) DO UPDATE SET
			events = EXCLUDED.events,
			runs = EXCLUDED.runs,
			passed = EXCLUDED.passed,
			blocked = EXCLUDED.blocked,
			sent_to_review = EXCLUDED.sent_to_review
	`);
}

interface HourlyRow {
	bucket: number;
	n: number;
}

async function hourlySeries(db: Db, query: ReturnType<typeof sql>) {
	const result = await db.execute(query);
	const rows = result.rows as unknown as HourlyRow[];
	const series = Array.from({ length: 24 }, () => 0);
	for (const row of rows) {
		const index = Number(row.bucket);
		if (index >= 0 && index < 24) {
			series[index] = Number(row.n);
		}
	}
	return series;
}

/** Real Home stats in the demo's ModStats contract shape. */
export async function getHomeStats(db: Db): Promise<ModStats> {
	const scalar = async (query: ReturnType<typeof sql>): Promise<number> => {
		const result = await db.execute(query);
		return Number(
			(result.rows[0] as Record<string, unknown> | undefined)?.n ?? 0,
		);
	};

	const pending = await scalar(
		sql`SELECT count(*)::int AS n FROM moderation_items WHERE status = 'pending'`,
	);
	const pendingYesterday = await scalar(
		sql`SELECT count(*)::int AS n FROM moderation_items
		    WHERE status = 'pending' AND created_at < now() - interval '24 hours'`,
	);
	const resolvedToday = await scalar(
		sql`SELECT count(*)::int AS n FROM moderation_items
		    WHERE decided_at::date = now()::date`,
	);
	const resolvedYesterday = await scalar(
		sql`SELECT count(*)::int AS n FROM moderation_items
		    WHERE decided_at::date = (now() - interval '1 day')::date`,
	);
	const blocked24 = await scalar(
		sql`SELECT count(*)::int AS n FROM runs
		    WHERE verdict = 'block' AND created_at > now() - interval '24 hours'`,
	);
	const blockedPrev = await scalar(
		sql`SELECT count(*)::int AS n FROM runs
		    WHERE verdict = 'block'
		      AND created_at BETWEEN now() - interval '48 hours' AND now() - interval '24 hours'`,
	);

	const moderationSeries = await hourlySeries(
		db,
		sql`SELECT extract(hour FROM created_at)::int AS bucket, count(*)::int AS n
		    FROM moderation_items WHERE created_at > now() - interval '24 hours'
		    GROUP BY 1`,
	);
	const blockedSeries = await hourlySeries(
		db,
		sql`SELECT extract(hour FROM created_at)::int AS bucket, count(*)::int AS n
		    FROM runs WHERE verdict = 'block' AND created_at > now() - interval '24 hours'
		    GROUP BY 1`,
	);

	return {
		pendingReports: {
			value: pending,
			delta: pending - pendingYesterday,
			series: moderationSeries,
		},
		resolvedToday: {
			value: resolvedToday,
			delta: resolvedToday - resolvedYesterday,
			series: moderationSeries,
		},
		automodHits24h: {
			value: blocked24,
			delta: blocked24 - blockedPrev,
			series: blockedSeries,
		},
		/** No ban concept yet — honest zeros beat repurposed numbers. */
		bannedUsers: {
			value: 0,
			delta: 0,
			series: Array.from({ length: 24 }, () => 0),
		},
	};
}
