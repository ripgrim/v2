import { createServerFn } from "@tanstack/react-start";
import type { WorkflowDefinition } from "@tripwire/contracts";
import {
	DEFAULT_WORKFLOW,
	workflowDefinitionSchema,
} from "@tripwire/contracts";
import type { OrgWithRole } from "@tripwire/db";
import { accessGuardMiddleware } from "#/lib/server/gated-server-fn";
import {
	orgAdminMiddleware,
	orgMemberMiddleware,
	requireOrgRepoById,
} from "#/lib/server/org-guard";

export const getWorkflowForRepo = createServerFn({ method: "GET" })
	.middleware([accessGuardMiddleware, orgMemberMiddleware])
	.inputValidator((input: { org: string; repoId: string | null }) => input)
	.handler(async ({ data, context }): Promise<WorkflowDefinition> => {
		if (!data.repoId) {
			return DEFAULT_WORKFLOW;
		}
		await requireOrgRepoById(
			(context as { org: OrgWithRole }).org.id,
			data.repoId,
		);
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
	.middleware([accessGuardMiddleware, orgAdminMiddleware])
	.inputValidator(
		(input: { org: string; repoId: string; definition: unknown }) => input,
	)
	.handler(
		async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
			await requireOrgRepoById(
				(context as { org: OrgWithRole }).org.id,
				data.repoId,
			);
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
		},
	);
