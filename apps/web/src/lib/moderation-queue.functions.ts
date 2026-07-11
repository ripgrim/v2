import { createServerFn } from "@tanstack/react-start";

export interface ModerationQueueItem {
	id: string;
	runId: string;
	repoFullName: string;
	subjectNumber: number | null;
	actorLogin: string | null;
	createdAt: string;
}

export const listModerationQueue = createServerFn({ method: "GET" }).handler(
	async (): Promise<ModerationQueueItem[]> => {
		const { moderationServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		const items = await moderationServices.listPendingItems(getDb().db);
		return items.map((item) => ({
			id: item.id,
			runId: item.runId,
			repoFullName: item.repoFullName,
			subjectNumber: item.subjectNumber,
			actorLogin: item.actorLogin,
			createdAt: item.createdAt.toISOString(),
		}));
	},
);

export const decideModeration = createServerFn({ method: "POST" })
	.inputValidator(
		(input: { itemId: string; decision: "approve" | "deny" }) => input,
	)
	.handler(async ({ data }): Promise<{ ok: boolean }> => {
		const { moderationServices } = await import("@tripwire/db");
		const { getAuth } = await import("#/lib/server/auth");
		const { getDb, getBoss } = await import("#/lib/server/db");
		let decidedBy: string | null = null;
		const auth = getAuth();
		if (auth) {
			const { getStartContext } = await import(
				"@tanstack/start-storage-context"
			);
			const session = await auth.api.getSession({
				headers: getStartContext().request.headers,
			});
			decidedBy = session?.user.id ?? null;
		}
		const ok = await moderationServices.decideModerationItem(
			getDb().pool,
			await getBoss(),
			{ itemId: data.itemId, decision: data.decision, decidedBy },
		);
		return { ok };
	});
