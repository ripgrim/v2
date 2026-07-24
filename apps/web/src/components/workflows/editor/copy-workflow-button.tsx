import type { WorkflowDefinition } from "@tripwire/contracts";
import { useState } from "react";
import { toast } from "#/components/ui/toast";
import {
	type CustomRuleDisplay,
	workflowToMarkdown,
} from "#/lib/workflow-markdown";

/**
 * Copy the whole workflow as markdown. Mirrors CopyRunButton on the run page:
 * the label flips to "copied" for ~2s with the same toast. Serializes from the
 * loaded (secret-redacted) definition, and the serializer never emits a url or
 * signing secret by construction, so the clipboard cannot carry a webhook or
 * discord destination. Native button, so it stays keyboard accessible.
 */
export function CopyWorkflowButton({
	definition,
	customRules,
}: {
	definition: WorkflowDefinition;
	customRules: readonly CustomRuleDisplay[];
}) {
	const [copied, setCopied] = useState(false);
	const onCopy = () => {
		const md = workflowToMarkdown(definition, customRules);
		navigator.clipboard?.writeText(md);
		toast({
			title: "copied to clipboard",
			body: "The workflow has been copied to your clipboard.",
			status: "success",
			action: { label: "close", onClick: () => {} },
		});
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};
	return (
		<button
			className="shrink-0 rounded-md bg-surface-1 px-2.5 py-1 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
			onClick={onCopy}
			type="button"
		>
			{copied ? "copied" : "copy markdown"}
		</button>
	);
}
