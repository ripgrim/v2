import type { Reason } from "#/lib/moderation.types";

const LABEL: Record<Reason, string> = {
	spam: "Spam",
	harassment: "Harassment",
	"off-topic": "Off-topic",
	automod: "Automod",
	nsfw: "NSFW",
};

export function getReasonLabel(reason: Reason): string {
	return LABEL[reason];
}
