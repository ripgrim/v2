import { useState } from "react";

/**
 * The read-only "view raw" escape hatch (§9): a collapsed, visually subordinate
 * disclosure of the current config JSON — pretty-printed and copyable, never
 * editable. The debugging fallback, not the primary presentation.
 */
export function RawConfigDisclosure({ config }: { config: unknown }) {
	const [open, setOpen] = useState(false);
	const json = JSON.stringify(config ?? {}, null, 2);
	return (
		<div className="mt-2">
			<button
				className="text-[11px] text-muted-foreground hover:text-foreground"
				onClick={() => setOpen((o) => !o)}
				type="button"
			>
				{open ? "hide raw" : "view raw"}
			</button>
			{open ? (
				<div className="relative mt-1">
					<pre className="overflow-x-auto rounded-md border bg-surface-1 p-2 font-mono text-[11px] text-muted-foreground">
						{json}
					</pre>
					<button
						className="absolute top-1.5 right-1.5 rounded bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
						onClick={() => navigator.clipboard?.writeText(json)}
						type="button"
					>
						copy
					</button>
				</div>
			) : null}
		</div>
	);
}
