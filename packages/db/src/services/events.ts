import {
	type NormalizedEvent,
	normalizedEventSchema,
} from "@tripwire/contracts";
import { generateId } from "@tripwire/utils";
import { and, desc, eq, isNotNull, lt, sql } from "drizzle-orm";
import type { Pool } from "pg";
import type { PgBoss } from "pg-boss";
import type { Db } from "../client.ts";
import { PROCESS_EVENT_QUEUE } from "../queue.ts";
import { events } from "../schema/events.ts";

export interface InsertRawEventInput {
	deliveryId: string;
	rawKind: string;
	raw: unknown;
}

export interface InsertRawEventResult {
	/** false ⇒ redelivery; UNIQUE(delivery_id) made it a no-op (§5.3). */
	inserted: boolean;
	eventId: string | null;
}

/**
 * §5.2 — ONE transaction: insert the raw event AND enqueue the process-event
 * job. The pg-boss insert runs on the same tx client, so there is never a job
 * without a row or a row without a job. Redelivery (delivery_id conflict)
 * inserts nothing and enqueues nothing.
 */
export async function insertRawEvent(
	pool: Pool,
	boss: PgBoss,
	input: InsertRawEventInput,
): Promise<InsertRawEventResult> {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const id = generateId();
		const res = await client.query<{ id: string }>(
			`INSERT INTO events (id, delivery_id, raw_kind, raw)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (delivery_id) DO NOTHING
			 RETURNING id`,
			[id, input.deliveryId, input.rawKind, JSON.stringify(input.raw)],
		);
		const inserted = res.rowCount === 1;
		if (inserted) {
			await boss.insert(PROCESS_EVENT_QUEUE, [{ data: { eventId: id } }], {
				db: {
					executeSql: (text: string, values?: unknown[]) =>
						client.query(text, values),
				},
			});
		}
		await client.query("COMMIT");
		return { inserted, eventId: inserted ? id : null };
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

/**
 * §5.6 — write the normalized form onto the event row (validated on write)
 * and NOTIFY 'events' so the SSE fan-out picks it up.
 */
export async function markEventNormalized(
	db: Db,
	pool: Pool,
	eventId: string,
	normalized: NormalizedEvent,
): Promise<void> {
	const valid = normalizedEventSchema.parse(normalized);
	const subjectNumber =
		"changeRequest" in valid
			? valid.changeRequest.number
			: "comment" in valid
				? valid.comment.subjectNumber
				: null;
	const headSha =
		"changeRequest" in valid
			? valid.changeRequest.headSha
			: "push" in valid
				? valid.push.headSha
				: null;
	await db
		.update(events)
		.set({
			kind: valid.kind,
			repoFullName: "repo" in valid ? valid.repo.fullName : null,
			actorLogin: valid.actor.login,
			subjectNumber,
			headSha,
			normalized: valid,
			normalizedAt: new Date(),
		})
		.where(eq(events.id, eventId));
	await pool.query("SELECT pg_notify('events', $1)", [eventId]);
}

/** §5.5 — parse failure ⇒ quarantine + fixture candidate (raw stays intact). */
export async function quarantineEvent(
	db: Db,
	eventId: string,
	reason: string,
): Promise<void> {
	await db
		.update(events)
		.set({ quarantined: true, quarantineReason: reason })
		.where(eq(events.id, eventId));
}

export async function getEventById(db: Db, eventId: string) {
	const rows = await db.select().from(events).where(eq(events.id, eventId));
	return rows[0] ?? null;
}

/**
 * Cursor-paginated normalized events, newest first. UUIDv7 ids are
 * time-sortable, so the id itself is the cursor.
 */
export async function listEvents(
	db: Db,
	{ cursor, limit = 50 }: { cursor?: string; limit?: number } = {},
) {
	const rows = await db
		.select()
		.from(events)
		.where(
			cursor
				? and(isNotNull(events.normalizedAt), lt(events.id, cursor))
				: isNotNull(events.normalizedAt),
		)
		.orderBy(desc(events.id))
		.limit(limit);
	return {
		items: rows,
		nextCursor: rows.length === limit ? (rows.at(-1)?.id ?? null) : null,
	};
}

/** A normalized event joined to its run (0..1) — the /activity feed row. */
export interface ActivityRunSummary {
	runId: string;
	verdict: string | null;
	status: string;
	/** The first failing rule's plain-English one-liner (§10), when blocked. */
	reason: string | null;
}
export interface ActivityRow {
	event: NormalizedEvent;
	run: ActivityRunSummary | null;
}

interface ActivityQueryRow {
	normalized: unknown;
	run_id: string | null;
	verdict: string | null;
	status: string | null;
	reason: string | null;
}

function toActivityRow(row: ActivityQueryRow): ActivityRow {
	return {
		event: row.normalized as NormalizedEvent,
		run: row.run_id
			? {
					runId: row.run_id,
					verdict: row.verdict,
					status: row.status ?? "running",
					reason: row.reason,
				}
			: null,
	};
}

const ACTIVITY_FROM = sql`
	FROM events e
	LEFT JOIN runs r ON r.event_id = e.id
	LEFT JOIN LATERAL (
		SELECT s.summary FROM run_steps s
		WHERE s.run_id = r.id AND s.node_kind = 'rule' AND s.status = 'fail'
		ORDER BY s.started_at ASC LIMIT 1
	) fr ON true
`;

/**
 * The /activity feed (§9): cursor-paginated normalized events, each joined to
 * its run (verdict + status) and the first failing rule's one-liner. UUIDv7
 * event ids are the cursor. One run per event (§5.11 joins workflows into one).
 */
export async function listActivity(
	db: Db,
	{ cursor, limit = 50 }: { cursor?: string; limit?: number } = {},
): Promise<{ items: ActivityRow[]; nextCursor: string | null }> {
	const result = await db.execute(sql`
		SELECT e.id AS event_id, e.normalized, r.id AS run_id, r.verdict,
		       r.status, fr.summary AS reason
		${ACTIVITY_FROM}
		WHERE e.normalized_at IS NOT NULL
		  ${cursor ? sql`AND e.id < ${cursor}` : sql``}
		ORDER BY e.id DESC
		LIMIT ${limit}
	`);
	const rows = result.rows as unknown as (ActivityQueryRow & {
		event_id: string;
	})[];
	const items = rows.map(toActivityRow);
	return {
		items,
		nextCursor: rows.length === limit ? (rows.at(-1)?.event_id ?? null) : null,
	};
}

/** One activity row by event id — the live-resolve fetch after a run NOTIFY. */
export async function getActivityForEvent(
	db: Db,
	eventId: string,
): Promise<ActivityRow | null> {
	const result = await db.execute(sql`
		SELECT e.normalized, r.id AS run_id, r.verdict, r.status,
		       fr.summary AS reason
		${ACTIVITY_FROM}
		WHERE e.id = ${eventId}
		LIMIT 1
	`);
	const row = (result.rows as unknown as ActivityQueryRow[])[0];
	return row?.normalized ? toActivityRow(row) : null;
}
