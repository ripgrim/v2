/**
 * The Rules-page explainer copy for workflow composition (§6). Names the rules
 * the workflow owns (up to three, then "and N more" so at least the first
 * names stay visible at any count), and states plainly that every other rule
 * keeps running on its own toggle. No em dashes, short declarative sentences,
 * concrete nouns.
 */
export function workflowBannerCopy(ownedRuleNames: string[]): string {
	if (ownedRuleNames.length === 0) {
		return "Your workflow doesn't run any rules yet. Every rule below runs on its own toggle.";
	}
	return `Your workflow runs ${joinNames(ownedRuleNames)}. Every other rule runs on its own toggle.`;
}

function joinNames(names: string[]): string {
	if (names.length <= 3) {
		if (names.length === 1) {
			return names[0] as string;
		}
		if (names.length === 2) {
			return `${names[0]} and ${names[1]}`;
		}
		return `${names[0]}, ${names[1]}, and ${names[2]}`;
	}
	const shown = names.slice(0, 3);
	return `${shown.join(", ")}, and ${names.length - shown.length} more`;
}
