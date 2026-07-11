import { createServerFn } from "@tanstack/react-start";
import type { WorkflowDefinition } from "@tripwire/contracts";
import {
	DEFAULT_WORKFLOW,
	workflowDefinitionSchema,
} from "@tripwire/contracts";

export const getWorkflowForRepo = createServerFn({ method: "GET" })
	.inputValidator((input: { repoId: string | null }) => input)
	.handler(async ({ data }): Promise<WorkflowDefinition> => {
		if (!data.repoId) {
			return DEFAULT_WORKFLOW;
		}
		const { repoServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		const repo = await repoServices.getRepoById(getDb().db, data.repoId);
		if (!repo) {
			return DEFAULT_WORKFLOW;
		}
		const workflows = await repoServices.listEnabledWorkflows(
			getDb().db,
			repo.fullName,
		);
		return workflows[0] ?? DEFAULT_WORKFLOW;
	});

export const saveWorkflowForRepo = createServerFn({ method: "POST" })
	.inputValidator((input: { repoId: string; definition: unknown }) => input)
	.handler(async ({ data }): Promise<{ ok: true } | { error: string }> => {
		const parsed = workflowDefinitionSchema.safeParse(data.definition);
		if (!parsed.success) {
			const issue = parsed.error.issues[0];
			return { error: `${issue?.path.join(".")}: ${issue?.message}` };
		}
		const { repoServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		await repoServices.saveWorkflowDefinition(
			getDb().db,
			data.repoId,
			parsed.data,
		);
		return { ok: true };
	});
