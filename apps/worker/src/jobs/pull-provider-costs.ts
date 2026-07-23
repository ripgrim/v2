import { PLANETSCALE_MONTHLY } from "@tripwire/contracts";
import type { Db } from "@tripwire/db";
import { economicsServices } from "@tripwire/db";
import { getErrorMessage } from "@tripwire/utils";
import type { Logger } from "pino";

/**
 * pull-provider-costs (economics-surface-contracts.md): the daily invoice pull.
 * Railway usage, OpenRouter spend per key, PlanetScale accrual -> provider_costs_daily.
 * Each provider is independently guarded: a missing token or a failing pull skips
 * that provider and never blocks the others. Cron time 01:40 UTC, targeting the
 * UTC day that just closed. This job only reads external APIs and writes the
 * invoice table; it never touches a run.
 */

export interface ProviderCostRow {
	provider: "railway" | "openrouter" | "planetscale";
	service: string;
	costUsd: number;
	usageJson: unknown;
	estimated: boolean;
}

/** Yesterday in UTC as YYYY-MM-DD — the day that closed before a 01:40 run. */
export function previousUtcDay(now: Date): string {
	const d = new Date(now.getTime());
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

function daysInUtcMonth(day: string): number {
	const [y, m] = day.split("-").map(Number);
	if (!y || !m) {
		return 30;
	}
	return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** The UTC day after `day` (YYYY-MM-DD), for a half-open time range. */
function nextUtcDay(day: string): string {
	const d = new Date(`${day}T00:00:00.000Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}

function numFromEnv(raw: string | undefined): number | null {
	if (raw == null || raw === "") {
		return null;
	}
	const n = Number(raw);
	return Number.isFinite(n) ? n : null;
}

function firstFiniteNumber(obj: unknown, keys: string[]): number | null {
	if (!obj || typeof obj !== "object") {
		return null;
	}
	for (const key of keys) {
		const v = (obj as Record<string, unknown>)[key];
		if (typeof v === "number" && Number.isFinite(v)) {
			return v;
		}
	}
	return null;
}

/**
 * Sum OpenRouter spend from an analytics/query response. The endpoint returns
 * `{ data: { data: [ { total_usage, tokens_total, ... } ], metadata } }`. The
 * time window is already applied by the request, so we sum every row's
 * `total_usage` (USD) and `tokens_total`. Tolerant of the shape: unknown records
 * contribute zero, never throw. `tokens_total` can arrive as a string.
 */
export function extractOpenRouterDailyCost(json: unknown): {
	costUsd: number;
	tokens: number;
} {
	const outer = (json as { data?: unknown })?.data;
	const records: unknown[] = Array.isArray(
		(outer as { data?: unknown[] })?.data,
	)
		? ((outer as { data: unknown[] }).data ?? [])
		: Array.isArray(outer)
			? (outer as unknown[])
			: Array.isArray(json)
				? (json as unknown[])
				: [];
	let costUsd = 0;
	let tokens = 0;
	for (const rec of records) {
		if (!rec || typeof rec !== "object") {
			continue;
		}
		costUsd += firstFiniteNumber(rec, ["total_usage", "usage", "cost"]) ?? 0;
		const tk = (rec as { tokens_total?: unknown; tokens?: unknown })
			.tokens_total;
		const n = typeof tk === "string" ? Number(tk) : tk;
		if (typeof n === "number" && Number.isFinite(n)) {
			tokens += n;
		}
	}
	return { costUsd, tokens };
}

export interface PullConfig {
	openrouter: {
		managementKey: string | null;
		keyHashes: { prod: string | null; eval: string | null };
	};
	railway: { usageUsd: number | null };
	planetscale: {
		tokenId: string | null;
		token: string | null;
		org: string | null;
	};
}

/** Read pull configuration from env. Absent tokens leave a provider disabled. */
export function pullConfigFromEnv(): PullConfig {
	return {
		openrouter: {
			managementKey: process.env.OPENROUTER_MANAGEMENT_KEY ?? null,
			keyHashes: {
				prod: process.env.OPENROUTER_PROD_KEY_HASH ?? null,
				eval: process.env.OPENROUTER_EVAL_KEY_HASH ?? null,
			},
		},
		railway: { usageUsd: numFromEnv(process.env.RAILWAY_USAGE_USD) },
		planetscale: {
			tokenId: process.env.PLANETSCALE_SERVICE_TOKEN_ID ?? null,
			token: process.env.PLANETSCALE_SERVICE_TOKEN ?? null,
			org: process.env.PLANETSCALE_ORG ?? null,
		},
	};
}

type Fetch = typeof fetch;

async function pullOpenRouter(
	fetchImpl: Fetch,
	cfg: PullConfig["openrouter"],
	day: string,
): Promise<ProviderCostRow[]> {
	if (!cfg.managementKey) {
		return [];
	}
	const headers = {
		authorization: `Bearer ${cfg.managementKey}`,
		"content-type": "application/json",
	};
	const nextDay = nextUtcDay(day);
	// POST /api/v1/analytics/query with the day as a half-open time range. A key
	// hash filter splits prod from eval; without hashes we take the account
	// aggregate as 'prod-key' (which still includes eval until hashes are set).
	const bodyFor = (hash: string | null) =>
		JSON.stringify({
			metrics: ["total_usage", "tokens_total", "request_count"],
			...(hash
				? { filters: [{ field: "api_key_hash", operator: "eq", value: hash }] }
				: {}),
			time_range: { start: `${day}T00:00:00Z`, end: `${nextDay}T00:00:00Z` },
			granularity: "day",
		});
	const post = async (hash: string | null) => {
		const res = await fetchImpl(
			"https://openrouter.ai/api/v1/analytics/query",
			{ method: "POST", headers, body: bodyFor(hash) },
		);
		if (!res.ok) {
			throw new Error(`openrouter analytics ${res.status}`);
		}
		return res.json();
	};
	const targets: { service: string; hash: string | null }[] =
		cfg.keyHashes.prod || cfg.keyHashes.eval
			? [
					{ service: "prod-key", hash: cfg.keyHashes.prod },
					{ service: "eval-key", hash: cfg.keyHashes.eval },
				].filter((t) => t.hash)
			: [{ service: "prod-key", hash: null }];
	const rows: ProviderCostRow[] = [];
	for (const target of targets) {
		const json = await post(target.hash);
		const { costUsd, tokens } = extractOpenRouterDailyCost(json);
		rows.push({
			provider: "openrouter",
			service: target.service,
			costUsd,
			usageJson: { tokens, raw: json },
			estimated: false,
		});
	}
	return rows;
}

/**
 * Railway billing has no stable public GraphQL query, so the usage figure is
 * operator-provided via RAILWAY_USAGE_USD (the current MTD number from the
 * dashboard), mirroring how PlanetScale is modeled flat. Marked estimated. When
 * the env is unset, Railway is simply skipped.
 */
function pullRailway(cfg: PullConfig["railway"]): ProviderCostRow[] {
	if (cfg.usageUsd == null) {
		return [];
	}
	return [
		{
			provider: "railway",
			service: "main",
			costUsd: cfg.usageUsd,
			usageJson: { note: "from RAILWAY_USAGE_USD" },
			estimated: true,
		},
	];
}

async function pullPlanetScale(
	fetchImpl: Fetch,
	cfg: PullConfig["planetscale"],
	day: string,
): Promise<ProviderCostRow[]> {
	// PlanetScale is modeled flat-accrued, so the daily figure is interpolated
	// and marked estimated. When a service token is present we also pull the
	// invoice for audit and credit tracking; the interpolated cost stands either
	// way so the page never blocks on the invoice API.
	const daily = PLANETSCALE_MONTHLY / daysInUtcMonth(day);
	let usageJson: unknown = { note: "interpolated from PLANETSCALE_MONTHLY" };
	if (cfg.tokenId && cfg.token && cfg.org) {
		const res = await fetchImpl(
			`https://api.planetscale.com/v1/organizations/${cfg.org}/invoices`,
			{
				headers: {
					authorization: `${cfg.tokenId}:${cfg.token}`,
					accept: "application/json",
				},
			},
		);
		if (res.ok) {
			usageJson = await res.json();
		}
	}
	return [
		{
			provider: "planetscale",
			service: "main",
			costUsd: daily,
			usageJson,
			estimated: true,
		},
	];
}

export interface PullDeps {
	db: Db;
	logger: Logger;
	fetchImpl?: Fetch;
	config?: PullConfig;
	now?: Date;
}

export interface PullResult {
	day: string;
	written: number;
	providers: Record<string, "ok" | "skipped" | "failed">;
}

export async function pullProviderCosts(deps: PullDeps): Promise<PullResult> {
	const fetchImpl = deps.fetchImpl ?? fetch;
	const config = deps.config ?? pullConfigFromEnv();
	const day = previousUtcDay(deps.now ?? new Date());
	const providers: PullResult["providers"] = {};
	let written = 0;

	const run = async (
		name: string,
		enabled: boolean,
		fn: () => Promise<ProviderCostRow[]>,
	) => {
		if (!enabled) {
			providers[name] = "skipped";
			return;
		}
		try {
			const rows = await fn();
			for (const row of rows) {
				await economicsServices.upsertProviderCost(deps.db, { day, ...row });
				written++;
			}
			providers[name] = "ok";
		} catch (error) {
			providers[name] = "failed";
			deps.logger.warn(
				{ provider: name, error: getErrorMessage(error) },
				"provider cost pull failed — other providers unaffected",
			);
		}
	};

	await run("openrouter", Boolean(config.openrouter.managementKey), () =>
		pullOpenRouter(fetchImpl, config.openrouter, day),
	);
	await run("railway", config.railway.usageUsd != null, () =>
		Promise.resolve(pullRailway(config.railway)),
	);
	// PlanetScale always writes the interpolated accrual, invoice or not.
	await run("planetscale", true, () =>
		pullPlanetScale(fetchImpl, config.planetscale, day),
	);

	deps.logger.info({ day, written, providers }, "provider costs pulled");
	return { day, written, providers };
}
