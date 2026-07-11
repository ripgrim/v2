import type { WorkflowDefinition } from "@tripwire/contracts";
import { DEFAULT_WORKFLOW as DEFINITION } from "@tripwire/contracts";
import { validateWorkflow } from "@tripwire/core";

/** Validated at module load — a broken default is a boot failure. */
const validated = validateWorkflow(DEFINITION);
if (!validated.valid) {
	throw new Error(
		`default workflow invalid: ${JSON.stringify(validated.issues)}`,
	);
}

export const DEFAULT_WORKFLOW: WorkflowDefinition = validated.definition;
