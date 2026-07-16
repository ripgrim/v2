import { createServerFn } from "@tanstack/react-start";
import type { WorkflowDefinition } from "@tripwire/contracts";
import {
	DEFAULT_WORKFLOW,
	workflowDefinitionSchema,
} from "@tripwire/contracts";
import { accessGuardMiddleware } from "#/lib/server/gated-server-fn";

export const getWorkflowForRepo = createServerFn({ method: "GET" })
	.middleware([accessGuardMiddleware])
	.inputValidator((input: { repoId: string | null }) => input)
	.handler(async ({ data }): Promise<WorkflowDefinition> => {
		const { requireSession } = await import("#/lib/server/session");
		await requireSession();
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
	.middleware([accessGuardMiddleware])
	.inputValidator((input: { repoId: string; definition: unknown }) => input)
	.handler(async ({ data }): Promise<{ ok: true } | { error: string }> => {
		const { requireSession } = await import("#/lib/server/session");
		await requireSession();
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
