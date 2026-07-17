import { formatParamValue, type RuleParam } from "@tripwire/contracts";

/**
 * A param's value as it reads in a sentence (§9): a bold scalar (value + unit /
 * percent via the shared formatter) or, for a string-list, its entries as
 * monospace chips. Display-only — editing is `ParamEditor`.
 */
export function ParamValue({
	param,
	value,
}: {
	param: RuleParam;
	value: unknown;
}) {
	if (param.kind === "string-list") {
		const items = Array.isArray(value)
			? (value as string[])
			: [...param.default];
		return (
			<span className="inline-flex flex-wrap gap-1 align-middle">
				{items.map((item) => (
					<code
						className="rounded bg-surface-1 px-1 py-0.5 font-mono text-[11px] text-foreground"
						key={item}
					>
						{item}
					</code>
				))}
			</span>
		);
	}
	return (
		<span className="font-semibold text-foreground">
			{formatParamValue(param, value)}
		</span>
	);
}
