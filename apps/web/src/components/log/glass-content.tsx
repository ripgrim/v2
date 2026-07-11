"use client";
import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { cn } from "#/lib/utils";

/**
 * Sensitive content behind fluted frosted glass. The reveal control sits at the
 * bottom edge; clicking clears the fog so it feels like wiping the glass.
 */
export function GlassContent({ content }: { content: string }) {
	const [revealed, setRevealed] = useState(false);

	return (
		<div className="relative min-h-11 overflow-hidden rounded-md">
			<p className="text-foreground text-xs leading-relaxed">{content}</p>
			<button
				type="button"
				onClick={() => setRevealed(true)}
				aria-label="Reveal content"
				className={cn(
					"group fluted-glass absolute inset-0 flex items-end justify-center rounded-md transition-opacity duration-500",
					revealed && "pointer-events-none opacity-0",
				)}
			>
				<span className="relative mb-1.5 inline-flex translate-y-0 items-center gap-1 rounded-full border border-white/20 bg-card/70 px-2 py-0.5 font-medium text-[11px] shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
					<HugeiconsIcon icon={ViewIcon} size={11} strokeWidth={2} />
					Reveal
				</span>
			</button>
		</div>
	);
}
