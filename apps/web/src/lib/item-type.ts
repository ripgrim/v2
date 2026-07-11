import { CircleDot, GitPullRequest, MessageSquare } from "lucide-react";
import type { ItemType } from "#/lib/moderation.types";

type IconComponent = typeof CircleDot;

type ItemTypeConfig = {
	icon: IconComponent;
	label: string;
};

const ITEM_TYPE: Record<ItemType, ItemTypeConfig> = {
	issue: { icon: CircleDot, label: "Issue" },
	pull: { icon: GitPullRequest, label: "Pull request" },
	comment: { icon: MessageSquare, label: "Comment" },
};

export function getItemTypeConfig(type: ItemType): ItemTypeConfig {
	return ITEM_TYPE[type];
}
