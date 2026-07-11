"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "#/lib/utils";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789<>[]{}/=+-*&^%$#@!?".split(
	"",
);

// How often a still-scrambling slot swaps glyph (quantized → calm flicker).
const FLICKER_MS = 100;
// Scramble time before the first slot locks, and the spread of the lock-in.
const LEAD_MS = 220;
const SPREAD_MS = 620;

const glyphAt = (i: number, step: number) =>
	GLYPHS[((step + i) * 41 + 7) % GLYPHS.length];

/**
 * Decodes `text` with a quick left→right matrix scramble on mount — each slot
 * flickers through a few random glyphs, then locks to its final character.
 */
export function ScrambleText({
	text,
	className,
	delay = 0,
	animate = true,
}: {
	text: string;
	className?: string;
	delay?: number;
	/** When false the final text renders immediately (e.g. cached data). */
	animate?: boolean;
}) {
	const [out, setOut] = useState(text);
	const start = useRef(0);

	useEffect(() => {
		if (!animate) {
			setOut(text);
			return;
		}
		let raf = 0;
		start.current = 0;
		const chars = [...text];
		const len = Math.max(1, chars.length);
		let prev = "";

		const tick = (now: number) => {
			if (!start.current) start.current = now;
			const elapsed = now - start.current - delay;
			const step = Math.floor(now / FLICKER_MS);

			let settled = true;
			const next = chars
				.map((c, i) => {
					if (c === " ") return " ";
					const lockAt = LEAD_MS + (i / len) * SPREAD_MS;
					if (elapsed >= lockAt) return c;
					settled = false;
					return glyphAt(i, step);
				})
				.join("");

			// only repaint when the visible string changes — keeps the flicker calm
			if (next !== prev) {
				prev = next;
				setOut(next);
			}
			if (settled) {
				setOut(text);
				return;
			}
			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [text, delay, animate]);

	return <span className={cn("tabular-nums", className)}>{out}</span>;
}
