"use client";

import type { DitherColor } from "@tripwire/contracts";
import { useEffect, useRef } from "react";
import { cn } from "#/lib/utils";

/** Re-exported from `@tripwire/contracts`; `RepoMetric.color` is the contract. */
export type { DitherColor };

// 4×4 ordered (Bayer) dither matrix, normalized to 0–1 thresholds.
const BAYER = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

type Rgb = [number, number, number];

// Each seed: the area-fill hue, the bright series line, and the star sparkle.
const PALETTE: Record<DitherColor, { fill: Rgb; line: Rgb; star: Rgb }> = {
	green: { fill: [40, 210, 110], line: [150, 255, 180], star: [200, 255, 220] },
	// oklch(64.7% 0.172 254deg)
	blue: { fill: [53, 143, 243], line: [150, 200, 255], star: [205, 228, 255] },
	purple: {
		fill: [150, 110, 255],
		line: [200, 175, 255],
		star: [225, 210, 255],
	},
	pink: { fill: [240, 90, 190], line: [255, 170, 220], star: [255, 205, 235] },
	orange: {
		fill: [255, 150, 50],
		line: [255, 195, 130],
		star: [255, 220, 175],
	},
	red: { fill: [240, 70, 70], line: [255, 150, 140], star: [255, 195, 185] },
	// No-data: a muted grey flatline so empty metrics read as "nothing here".
	grey: { fill: [92, 92, 100], line: [140, 140, 150], star: [165, 165, 175] },
};

type Star = { xFrac: number; depth: number; phase: number };
const rgb = ([r, g, b]: Rgb, k = 1, a = 1) =>
	`rgba(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)},${a})`;

function resample(data: number[], cols: number): number[] {
	const max = Math.max(...data, 1);
	const out: number[] = [];
	for (let x = 0; x < cols; x++) {
		const t = (x / Math.max(cols - 1, 1)) * (data.length - 1);
		const i = Math.floor(t);
		const f = t - i;
		const a = data[i] ?? 0;
		const b = data[Math.min(i + 1, data.length - 1)] ?? a;
		out.push(((a + (b - a) * f) / max) * 0.84 + 0.08);
	}
	return out;
}

/**
 * A pixelated line chart whose area fill is rendered with ordered dithering in
 * a seed color — denser near the line, thinning toward the floor — with a
 * scattering of brighter "stars" that wink. The expensive dither pass is cached
 * to an offscreen canvas and only re-run when the shape changes, so the live
 * crosshair (`markerIndex`) and wink stay cheap even at high resolution. When
 * `data` changes the surface eases to the new shape.
 */
export function DitherChart({
	data,
	color = "green",
	className,
	cols = 200,
	rows = 70,
	markerIndex = null,
	hovered = false,
	hoverFocus = true,
}: {
	data: number[];
	color?: DitherColor;
	className?: string;
	cols?: number;
	rows?: number;
	markerIndex?: number | null;
	/** Parent-driven hover (e.g. the whole card) — lifts the dither into focus. */
	hovered?: boolean;
	/** Set false to opt a chart out of the hover focus (e.g. the big chart). */
	hoverFocus?: boolean;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const target = useRef<number[]>([]);
	const current = useRef<number[]>([]);
	const colorRef = useRef(color);
	const markerRef = useRef(markerIndex);
	const lenRef = useRef(data.length);
	// Parent-driven (card/row) so the whole card lights the chart, not just the
	// canvas. A quiet density/brightness lift — the surface shape never moves.
	const hoverRef = useRef(false);
	colorRef.current = color;
	markerRef.current = markerIndex;
	lenRef.current = data.length;
	hoverRef.current = hoverFocus && hovered;

	useEffect(() => {
		target.current = resample(data, cols);
		if (current.current.length !== cols) {
			current.current = target.current.slice();
		}
	}, [data, cols]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!(canvas && ctx)) return;
		canvas.width = cols;
		canvas.height = rows;

		// Offscreen cache for the static dither fill.
		const off = document.createElement("canvas");
		off.width = cols;
		off.height = rows;
		const octx = off.getContext("2d");
		if (!octx) return;

		const stars: Star[] = [];
		for (let i = 0; i < Math.max(4, Math.round(cols / 8)); i++) {
			stars.push({
				xFrac: ((i * 67 + 13) % cols) / cols,
				depth: ((i * 53 + 7) % 100) / 100,
				phase: (i * 41) % 360,
			});
		}

		// Eases 0→1 while hovered. Lifts the dither fill density and brightness
		// only — the surface shape never moves.
		let intensity = 0;

		const topAt = (x: number) => {
			const cur = current.current;
			return Math.round((1 - (cur[x] ?? 0)) * (rows - 1));
		};

		const paintFill = () => {
			const pal = PALETTE[colorRef.current];
			octx.clearRect(0, 0, cols, rows);
			for (let x = 0; x < cols; x++) {
				const top = topAt(x);
				const depth = rows - top;
				for (let y = top; y < rows; y++) {
					const density = 1 - (y - top) / Math.max(depth, 1);
					// Hover lowers the dither threshold (more cells survive → denser
					// fill) and lifts brightness a touch: a steady focus, not motion.
					if (density <= BAYER[y % 4][x % 4] - 0.1 * intensity) continue;
					const k = (0.3 + density * 0.7) * (1 + 0.22 * intensity);
					octx.fillStyle = rgb(pal.fill, k);
					octx.fillRect(x, y, 1, 1);
				}
				octx.fillStyle = rgb(pal.line);
				octx.fillRect(x, top, 1, 1);
			}
		};

		let raf = 0;
		let tick = 0;
		let last = 0;
		let lastMarker: number | null | undefined = Symbol() as never;
		let lastColor = colorRef.current;
		let needsFill = true;

		const draw = (now: number) => {
			raf = requestAnimationFrame(draw);

			const cur = current.current;
			const tgt = target.current;
			let moving = false;
			if (cur.length === cols && tgt.length === cols) {
				for (let x = 0; x < cols; x++) {
					const d = tgt[x] - cur[x];
					if (Math.abs(d) > 0.001) {
						cur[x] += d * 0.18;
						moving = true;
					} else cur[x] = tgt[x];
				}
			}
			if (moving) needsFill = true;
			if (colorRef.current !== lastColor) {
				lastColor = colorRef.current;
				needsFill = true;
			}

			// Ease the hover focus; re-fill the cache while it's still settling.
			const itTarget = hoverRef.current ? 1 : 0;
			let settling = false;
			if (Math.abs(intensity - itTarget) > 0.001) {
				intensity += (itTarget - intensity) * 0.16;
				settling = true;
				needsFill = true;
			} else intensity = itTarget;

			const marker = markerRef.current;
			const markerChanged = marker !== lastMarker;
			const winkDue = now - last >= 100;
			if (!(moving || markerChanged || winkDue || settling)) return;
			last = now;
			tick++;
			lastMarker = marker;
			if (cur.length !== cols) return;

			if (needsFill) {
				paintFill();
				needsFill = false;
			}
			ctx.clearRect(0, 0, cols, rows);
			ctx.drawImage(off, 0, 0);

			const pal = PALETTE[colorRef.current];
			if (marker != null && lenRef.current > 1) {
				const mx = Math.round((marker / (lenRef.current - 1)) * (cols - 1));
				for (let y = 0; y < rows; y += 2) {
					ctx.fillStyle = rgb(pal.line, 1, 0.4);
					ctx.fillRect(mx, y, 1, 1);
				}
				const my = topAt(mx);
				ctx.fillStyle = rgb(pal.star);
				ctx.fillRect(mx, my - 1, 1, 3);
			}

			for (const s of stars) {
				const sx = Math.min(cols - 1, Math.round(s.xFrac * cols));
				const lineTop = topAt(sx);
				const sy = lineTop + Math.round(s.depth * (rows - lineTop));
				const tw = (Math.sin((tick + s.phase) * 0.35) + 1) / 2;
				if (tw < 0.55 || sy >= rows) continue;
				ctx.fillStyle = rgb(pal.star, 1, tw);
				ctx.fillRect(sx, sy, 1, 1);
			}
		};

		raf = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(raf);
	}, [cols, rows]);

	return (
		<canvas
			ref={canvasRef}
			className={cn("h-full w-full", className)}
			style={{ imageRendering: "pixelated" }}
		/>
	);
}
