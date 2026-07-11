/**
 * Moderation types now live in `@tripwire/contracts` (the shared language).
 * Re-exported so existing `#/lib/moderation.types` imports keep resolving while
 * typechecking is enforced against the contract.
 */
export type {
	Actor,
	FlaggedItem,
	ItemType,
	ModerationAction,
	ModStat,
	ModStats,
	ModStatus,
	Reason,
	Repository,
	Severity,
} from "@tripwire/contracts";
