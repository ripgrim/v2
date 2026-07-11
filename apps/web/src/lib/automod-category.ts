import { Activity, Ban, Braces, Sparkles } from "lucide-react";
import type { RuleAction, RuleCategory } from "#/lib/automod.types";

type IconComponent = typeof Ban;

type CategoryConfig = {
	icon: IconComponent;
	label: string;
};

const CATEGORY: Record<RuleCategory, CategoryConfig> = {
	blocklist: { icon: Ban, label: "Blocklist" },
	heuristic: { icon: Activity, label: "Heuristic" },
	classifier: { icon: Sparkles, label: "Classifier" },
	regex: { icon: Braces, label: "Regex" },
};

export function getCategoryConfig(category: RuleCategory): CategoryConfig {
	return CATEGORY[category];
}

const ACTION_LABEL: Record<RuleAction, string> = {
	flag: "Flag",
	hide: "Hide",
	close: "Auto-close",
	"require-review": "Require review",
};

export function getActionLabel(action: RuleAction): string {
	return ACTION_LABEL[action];
}
