import type { Db } from "@tripwire/db";
import { insightServices } from "@tripwire/db";
import type { Logger } from "pino";

/** Daily Home stats (§4) — recomputes today + yesterday (late arrivals). */
export async function rollup(deps: { db: Db; logger: Logger }): Promise<void> {
	const today = new Date();
	const yesterday = new Date(today.getTime() - 86_400_000);
	for (const day of [yesterday, today]) {
		const iso = day.toISOString().slice(0, 10);
		await insightServices.computeDailyRollups(deps.db, iso);
	}
	deps.logger.info("daily rollups computed");
}
