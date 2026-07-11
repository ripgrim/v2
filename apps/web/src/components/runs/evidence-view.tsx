import type { JsonValue } from "#/lib/runs.functions";

/** Rule evidence, rendered raw — the typed payload that makes appeals real. */
export function EvidenceView({ evidence }: { evidence: JsonValue }) {
	if (evidence === null || evidence === undefined) {
		return null;
	}
	return (
		<pre className="mt-2 overflow-x-auto rounded-md bg-surface-1 px-3 py-2 font-mono text-xs leading-relaxed">
			{JSON.stringify(evidence, null, 2)}
		</pre>
	);
}
