import {
	type WorkflowDefinition,
	workflowDefinitionSchema,
} from "@tripwire/contracts";

export interface ValidationIssue {
	nodeId?: string;
	edgeId?: string;
	message: string;
}

export type ValidationResult =
	| { valid: true; definition: WorkflowDefinition }
	| { valid: false; issues: ValidationIssue[] };

/**
 * Structural validation of a workflow DAG (§6): schema shape, unique ids,
 * edges reference real nodes, `not` gates take exactly one input, moderation
 * resume edges only leave send-to-moderation nodes, at least one trigger, and
 * NO cycles — the executor's topo walk depends on it.
 */
export function validateWorkflow(input: unknown): ValidationResult {
	const parsed = workflowDefinitionSchema.safeParse(input);
	if (!parsed.success) {
		return {
			valid: false,
			issues: parsed.error.issues.map((issue) => ({
				message: `${issue.path.join(".")}: ${issue.message}`,
			})),
		};
	}
	const def = parsed.data;
	const issues: ValidationIssue[] = [];
	const nodeIds = new Set<string>();
	for (const node of def.nodes) {
		if (nodeIds.has(node.id)) {
			issues.push({ nodeId: node.id, message: "duplicate node id" });
		}
		nodeIds.add(node.id);
	}
	const edgeIds = new Set<string>();
	for (const edge of def.edges) {
		if (edgeIds.has(edge.id)) {
			issues.push({ edgeId: edge.id, message: "duplicate edge id" });
		}
		edgeIds.add(edge.id);
		if (!nodeIds.has(edge.from)) {
			issues.push({ edgeId: edge.id, message: `unknown source ${edge.from}` });
		}
		if (!nodeIds.has(edge.to)) {
			issues.push({ edgeId: edge.id, message: `unknown target ${edge.to}` });
		}
	}

	const byId = new Map(def.nodes.map((n) => [n.id, n]));
	if (!def.nodes.some((n) => n.type === "trigger")) {
		issues.push({ message: "workflow needs at least one trigger node" });
	}
	for (const node of def.nodes) {
		const incoming = def.edges.filter((e) => e.to === node.id);
		const outgoing = def.edges.filter((e) => e.from === node.id);
		if (node.type === "trigger" && incoming.length > 0) {
			issues.push({ nodeId: node.id, message: "trigger cannot have inputs" });
		}
		if (node.type === "gate" && node.mode === "not" && incoming.length !== 1) {
			issues.push({
				nodeId: node.id,
				message: "`not` gate takes exactly one input",
			});
		}
		if (node.type !== "trigger" && incoming.length === 0) {
			issues.push({ nodeId: node.id, message: "unreachable node" });
		}
		for (const edge of outgoing) {
			const isModerationEdge = edge.when === "approve" || edge.when === "deny";
			if (
				isModerationEdge &&
				!(node.type === "action" && node.action === "send-to-moderation")
			) {
				issues.push({
					edgeId: edge.id,
					message: "approve/deny edges may only leave send-to-moderation",
				});
			}
			if (
				node.type === "action" &&
				node.action !== "send-to-moderation" &&
				outgoing.length > 0
			) {
				issues.push({
					nodeId: node.id,
					message: "only send-to-moderation actions may have outputs",
				});
				break;
			}
		}
	}

	if (hasCycle(def, byId)) {
		issues.push({ message: "workflow contains a cycle" });
	}

	return issues.length === 0
		? { valid: true, definition: def }
		: { valid: false, issues };
}

function hasCycle(
	def: WorkflowDefinition,
	byId: Map<string, unknown>,
): boolean {
	const state = new Map<string, "visiting" | "done">();
	const adjacency = new Map<string, string[]>();
	for (const edge of def.edges) {
		adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
	}
	const visit = (id: string): boolean => {
		const s = state.get(id);
		if (s === "visiting") {
			return true;
		}
		if (s === "done") {
			return false;
		}
		state.set(id, "visiting");
		for (const next of adjacency.get(id) ?? []) {
			if (visit(next)) {
				return true;
			}
		}
		state.set(id, "done");
		return false;
	};
	return [...byId.keys()].some((id) => visit(id));
}
