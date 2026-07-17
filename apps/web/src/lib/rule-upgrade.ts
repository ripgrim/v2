import type { RuleCatalogEntry } from "@tripwire/contracts";
import type { JsonValue } from "#/lib/runs.functions";

/** A repo's pinned rule_configs row, as far as the upgrade decision needs it. */
export interface PinnedRuleConfig {
	version: number;
	enabled: boolean;
	config: unknown;
}

/**
 * Pure upgrade decision (§6 purpose b) — given the repo's pinned rule_config row
 * and the catalog's current entry, returns the `{version, enabled, config}` to
 * re-pin, or `null` to no-op (unconfigured, or already at/ahead of current).
 *
 * The pinned config is CARRIED FORWARD when it still parses under the new
 * version's schema, and falls back to the new default when the config shape
 * changed across the bump — so an upgrade never installs a config the new
 * version can't read. Extracted from the server fn so this logic is unit-
 * testable without a database.
 */
export function resolveRuleUpgrade(
	existing: PinnedRuleConfig | undefined,
	entry: RuleCatalogEntry,
): { version: number; enabled: boolean; config: JsonValue } | null {
	if (!existing || existing.version >= entry.version) {
		return null;
	}
	const parsed = entry.configSchema.safeParse(existing.config);
	return {
		version: entry.version,
		enabled: existing.enabled,
		config: (parsed.success ? parsed.data : entry.defaultConfig) as JsonValue,
	};
}
