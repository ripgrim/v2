import type { AiReviewTrace } from "@tripwire/contracts";

/**
 * The ai-review reasoning trace (§8), maintainer-only. Shows how the model got
 * to its verdict: each step, token totals, steps used vs max. Excerpts are
 * attacker-influenced text, so they render as escaped PLAIN TEXT in a muted mono
 * register (no markdown), the same treatment as the operator ref detail. The
 * version this trace belongs to is the run step's ruleId; it is not duplicated
 * here. Rendered inside the maintainer gate; the public run page never sees it.
 */
export function AiTraceDisclosure({ trace }: { trace: AiReviewTrace }) {
	return (
		<details className="mt-2">
			<summary className="cursor-pointer text-muted-foreground text-xs hover:text-foreground">
				reasoning trace
			</summary>
			<div className="mt-2 flex flex-col gap-2 rounded-md border bg-surface-1 p-2">
				<div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
					<span>
						steps {trace.stepsUsed}/{trace.maxSteps}
					</span>
					<span>in {trace.usage.input}</span>
					<span>out {trace.usage.output}</span>
					<span>cached {trace.usage.cached ?? "n/a"}</span>
					<span className="text-muted-foreground/70">{trace.model}</span>
				</div>
				{trace.trimmed ? (
					<p className="text-[11px] text-muted-foreground/70">
						trace trimmed to the first {trace.steps.length} steps.
					</p>
				) : null}
				<ol className="flex flex-col gap-1.5">
					{trace.steps.map((step, i) => (
						<li
							className="border-border/60 border-l-2 pl-2"
							key={i}
						>
							<span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
								{step.type === "tool_call"
									? `tool: ${step.toolName ?? ""}`
									: "reasoning"}
							</span>
							<pre className="mt-0.5 whitespace-pre-wrap wrap-break-word font-mono text-[11px] text-muted-foreground/80">
								{step.excerpt}
								{step.truncated ? " …[truncated]" : ""}
							</pre>
						</li>
					))}
				</ol>
			</div>
		</details>
	);
}
