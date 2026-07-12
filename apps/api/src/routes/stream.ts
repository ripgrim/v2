import { eventServices } from "@tripwire/db";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { ApiEnv } from "../env.ts";

const HEARTBEAT_MS = 15_000;

/**
 * GET /events/stream — SSE fed by Postgres LISTEN/NOTIFY (§5 fan-out). Each
 * connection holds a dedicated client (a pooled connection can't LISTEN);
 * notifications carry the event id, the row is fetched and the normalized
 * event is pushed. The web head merges these into the Query cache.
 *
 * Session-gated: dashboard data is for maintainers. The webhook route stays
 * public (HMAC is its auth); /healthz stays open. In dev open posture
 * (auth null) the stream stays usable.
 */
export const stream = new Hono<ApiEnv>().get(
	"/stream",
	async (c, next) => {
		const { auth } = c.get("deps");
		if (auth) {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				return c.json({ error: "session required" }, 401);
			}
		}
		return await next();
	},
	(c) =>
		streamSSE(c, async (s) => {
			const { db, pool, logger } = c.get("deps");
			const client = await pool.connect();
			let open = true;

			const onNotification = async (msg: {
				channel?: string;
				payload?: string;
			}) => {
				if (!(open && msg.payload)) {
					return;
				}
				// `runs` → a run reached a resolved state (or none ran); re-fetch the
				// joined activity row so the feed resolves "evaluating…" in place (§9).
				if (msg.channel === "runs") {
					const row = await eventServices.getActivityForEvent(db, msg.payload);
					if (row) {
						await s.writeSSE({
							event: "run",
							id: `${msg.payload}:run`,
							data: JSON.stringify(row),
						});
					}
					return;
				}
				const event = await eventServices.getEventById(db, msg.payload);
				if (event?.normalized) {
					await s.writeSSE({
						event: "event",
						id: event.id,
						data: JSON.stringify(event.normalized),
					});
				}
			};

			client.on("notification", (msg) => {
				onNotification(msg).catch((error) =>
					logger.warn({ error }, "sse notification push failed"),
				);
			});
			await client.query("LISTEN events");
			await client.query("LISTEN runs");

			s.onAbort(() => {
				open = false;
				client.query("UNLISTEN events").catch(() => undefined);
				client.query("UNLISTEN runs").catch(() => undefined);
				client.release();
			});

			while (open) {
				await s.writeSSE({ event: "heartbeat", data: String(Date.now()) });
				await s.sleep(HEARTBEAT_MS);
			}
		}),
);
