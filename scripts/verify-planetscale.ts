/**
 * `bun run verify:planetscale` — the pre-cutover gate for the production DB.
 *
 * Runs against the PRODUCTION connection strings and ASSERTS the two invariants
 * that a connection pooler can silently break, exiting non-zero on any failure:
 *
 *   A. TRANSACTION AFFINITY (on the POOLED `DATABASE_URL`). The ingest does
 *      INSERT event + enqueue pg-boss job in ONE transaction on ONE connection.
 *      A statement-level pooler would route the pg-boss insert to a different
 *      backend where it autocommits — so a ROLLBACK is the proof: after rolling
 *      back the transaction, NEITHER the event row NOR the enqueued job may
 *      survive. If either survives, transaction affinity is gone and the
 *      ingest's core invariant ("no job without a row, no row without a job")
 *      is silently broken.
 *
 *   B. LISTEN/NOTIFY (on the DIRECT `DATABASE_URL_DIRECT`). The SSE live feed
 *      LISTENs and the worker NOTIFYs on the direct/session endpoint. If a
 *      NOTIFY does not reach a LISTEN through this connection, the live feed is
 *      dead. **If B fails this script STOPS and says so — it does NOT fall back
 *      to 2s polling. That is a recorded spec decision, not this script's call.**
 *
 * Run this while NO worker is consuming the production queue (before cutover),
 * so the affinity commit-probe's job is never picked up mid-check.
 *
 * Depends only on `@tripwire/db` (pools, pg-boss, the real ingest service) so it
 * resolves from the repo root; `pg` types come through the pool it hands back.
 */
import {
	createBoss,
	createDb,
	createDirectPool,
	eventServices,
	PROCESS_EVENT_QUEUE,
} from "@tripwire/db";

const NOTIFY_CHANNEL = "tw_verify";
const NOTIFY_TIMEOUT_MS = 7000;

type PoolLike = ReturnType<typeof createDb>["pool"];

function fail(message: string): never {
	process.stderr.write(`\n✗ ${message}\n`);
	process.exit(1);
}

/** A unique, human-legible probe marker for the `delivery_id` text column. */
function probeMarker(kind: string): string {
	return `verify-${kind}-${crypto.randomUUID()}`;
}

const pooledUrl = process.env.DATABASE_URL;
const directUrl = process.env.DATABASE_URL_DIRECT;

if (!pooledUrl) {
	fail("DATABASE_URL (the PlanetScale pooled URL) is not set.");
}
if (!directUrl) {
	fail(
		"DATABASE_URL_DIRECT is not set.\n" +
			"  Confirm PlanetScale Postgres exposes a DIRECT / session (non-pooled)\n" +
			"  endpoint and set it here. If PlanetScale exposes NO direct endpoint,\n" +
			"  STOP — do not deploy: the SSE live feed depends on LISTEN/NOTIFY and\n" +
			"  the polling fallback is a spec decision, not a default.",
	);
}
if (directUrl === pooledUrl) {
	process.stdout.write(
		"⚠ DATABASE_URL_DIRECT == DATABASE_URL — only valid for a single local\n" +
			"  Postgres. In production these MUST be the pooled vs direct endpoints.\n",
	);
}

async function countEvents(
	pool: PoolLike,
	deliveryId: string,
): Promise<number> {
	const r = await pool.query<{ n: string }>(
		"SELECT count(*)::text AS n FROM events WHERE delivery_id = $1",
		[deliveryId],
	);
	return Number(r.rows[0]?.n ?? "0");
}

async function countJobs(pool: PoolLike, eventId: string): Promise<number> {
	const r = await pool.query<{ n: string }>(
		"SELECT count(*)::text AS n FROM pgboss.job WHERE data->>'eventId' = $1",
		[eventId],
	);
	return Number(r.rows[0]?.n ?? "0");
}

/** A — transaction affinity, proven by ROLLBACK, on the pooled URL. */
async function verifyTransactionAffinity(): Promise<void> {
	process.stdout.write("\nA. transaction affinity (pooled DATABASE_URL)\n");
	const { pool } = createDb(pooledUrl);
	const boss = await createBoss(pooledUrl);
	try {
		// A1 — commit path: the real ingest, atomically committed + visible.
		const commitDelivery = probeMarker("affinity-commit");
		const res = await eventServices.insertRawEvent(pool, boss, {
			deliveryId: commitDelivery,
			rawKind: "ping",
			raw: { probe: "verify-planetscale" },
		});
		if (!(res.inserted && res.eventId)) {
			fail("A1: insertRawEvent did not insert — cannot verify affinity.");
		}
		const eventId = res.eventId;
		const rows = await countEvents(pool, commitDelivery);
		const jobs = await countJobs(pool, eventId);
		if (rows !== 1 || jobs < 1) {
			fail(
				`A1: committed tx not atomic — event rows=${rows} (want 1), ` +
					`enqueued jobs=${jobs} (want ≥1).`,
			);
		}
		// Clean up the committed probe (no worker is consuming yet).
		await pool.query("DELETE FROM pgboss.job WHERE data->>'eventId' = $1", [
			eventId,
		]);
		await pool.query("DELETE FROM events WHERE delivery_id = $1", [
			commitDelivery,
		]);
		process.stdout.write("   ✓ A1 commit: event + job committed atomically\n");

		// A2 — ROLLBACK path: neither the row nor the job may survive.
		const rollbackDelivery = probeMarker("affinity-rollback");
		const client = await pool.connect();
		let rolledBackEventId: string;
		try {
			await client.query("BEGIN");
			const inserted = await client.query<{ id: string }>(
				`INSERT INTO events (id, delivery_id, raw_kind, raw)
				 VALUES (gen_random_uuid(), $1, $2, $3)
				 RETURNING id`,
				[
					rollbackDelivery,
					"ping",
					JSON.stringify({ probe: "verify-planetscale-rollback" }),
				],
			);
			rolledBackEventId = inserted.rows[0].id;
			// pg-boss enqueue on the SAME tx client, exactly as the ingest does.
			await boss.insert(
				PROCESS_EVENT_QUEUE,
				[{ data: { eventId: rolledBackEventId } }],
				{
					db: {
						executeSql: (text: string, values?: unknown[]) =>
							client.query(text, values),
					},
				},
			);
			await client.query("ROLLBACK");
		} finally {
			client.release();
		}
		const survivingRows = await countEvents(pool, rollbackDelivery);
		const survivingJobs = await countJobs(pool, rolledBackEventId);
		if (survivingRows !== 0 || survivingJobs !== 0) {
			fail(
				"A2: TRANSACTION AFFINITY IS BROKEN. After ROLLBACK, " +
					`event rows=${survivingRows} (want 0), jobs=${survivingJobs} (want 0). ` +
					"The pooler is not preserving transaction affinity (statement-level " +
					"pooling?). The ingest's INSERT+enqueue transaction is unsafe. " +
					"Switch the pooled endpoint to transaction/session pooling and re-run.",
			);
		}
		process.stdout.write(
			"   ✓ A2 rollback: neither event nor job survived the ROLLBACK\n",
		);
	} finally {
		await boss.stop({ close: true, graceful: false }).catch(() => undefined);
		await pool.end().catch(() => undefined);
	}
}

/** B — LISTEN/NOTIFY on the direct URL. If it fails, STOP (no polling fallback). */
async function verifyListenNotify(): Promise<void> {
	process.stdout.write("\nB. LISTEN/NOTIFY (direct DATABASE_URL_DIRECT)\n");
	const directPool = createDirectPool(directUrl);
	const token = crypto.randomUUID();
	const listener = await directPool.connect();
	const notifier = await directPool.connect();

	const received = new Promise<string>((resolve) => {
		listener.on(
			"notification",
			(msg: { channel: string; payload?: string }) => {
				if (msg.channel === NOTIFY_CHANNEL && msg.payload) {
					resolve(msg.payload);
				}
			},
		);
	});
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<null>((resolve) => {
		timer = setTimeout(() => resolve(null), NOTIFY_TIMEOUT_MS);
	});

	try {
		await listener.query(`LISTEN ${NOTIFY_CHANNEL}`);
		await notifier.query("SELECT pg_notify($1, $2)", [NOTIFY_CHANNEL, token]);
		const payload = await Promise.race([received, timeout]);
		if (payload !== token) {
			fail(
				"LISTEN/NOTIFY did NOT survive the direct connection " +
					`(sent "${token}", got ${payload === null ? "nothing (timeout)" : `"${payload}"`}).\n` +
					"  STOPPING. The SSE live activity feed depends on LISTEN/NOTIFY.\n" +
					"  Do NOT fall back to 2s polling — that is a recorded spec decision,\n" +
					"  not this script's to make. Report this and wait.",
			);
		}
		process.stdout.write(
			"   ✓ B: NOTIFY payload arrived on the LISTEN client\n",
		);
	} finally {
		if (timer) {
			clearTimeout(timer);
		}
		listener.release();
		notifier.release();
		await directPool.end().catch(() => undefined);
	}
}

await verifyTransactionAffinity();
await verifyListenNotify();
process.stdout.write(
	"\n✓ PlanetScale verified: transaction affinity + LISTEN/NOTIFY both hold.\n",
);
process.exit(0);
