"use client";

import { useEffect, useRef } from "react";
import { cn } from "#/lib/utils";

// 4×4 ordered (Bayer) dither matrix, normalized to 0–1 thresholds.
const BAYER = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

/**
 * A glow that hugs a highlighted comment as a band of dithered pixels and very
 * slowly leaks 1px cells outward. Rendered at a small fixed backing resolution
 * (scaled up `pixelated`) so the loops stay tiny regardless of the card size —
 * pointer-transparent, behind the card.
 */
export function DitherGlow({
	pad = 40,
	className,
}: {
	pad?: number;
	className?: string;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!(canvas && ctx)) return;

		const R = 54;
		const G = 140;
		const B = 237; // #368CED
		const reduce = window.matchMedia?.(
			"(prefers-reduced-motion: reduce)",
		)?.matches;

		// Backing-pixel space (small, capped); the canvas CSS box is the card+pad.
		let W = 0;
		let H = 0;
		let cssW = 0;
		let cssH = 0;
		let cx = 0;
		let cy = 0;
		let hw = 0;
		let hh = 0;
		const radius = 8;
		const band = 9;

		const bandCache = document.createElement("canvas");
		const bctx = bandCache.getContext("2d");
		if (!bctx) return;

		const sdf = (px: number, py: number) => {
			const qx = Math.abs(px - cx) - (hw - radius);
			const qy = Math.abs(py - cy) - (hh - radius);
			return (
				Math.min(Math.max(qx, qy), 0) +
				Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) -
				radius
			);
		};

		const paintBand = () => {
			bctx.clearRect(0, 0, W, H);
			for (let y = 0; y < H; y++) {
				for (let x = 0; x < W; x++) {
					const d = sdf(x + 0.5, y + 0.5);
					if (d <= 0 || d > band) continue;
					let density = 1 - d / band;
					density *= density;
					if (density <= BAYER[y & 3][x & 3]) continue;
					bctx.fillStyle = `rgba(${R},${G},${B},${0.16 + density * 0.6})`;
					bctx.fillRect(x, y, 1, 1);
				}
			}
		};

		const resize = () => {
			const r = canvas.getBoundingClientRect();
			const nW = Math.max(1, Math.round(r.width));
			const nH = Math.max(1, Math.round(r.height));
			if (nW === cssW && nH === cssH) return; // guard against repeat fires
			cssW = nW;
			cssH = nH;
			const scale = Math.min(1, 300 / cssW);
			W = Math.max(1, Math.round(cssW * scale));
			H = Math.max(1, Math.round(cssH * scale));
			canvas.width = W;
			canvas.height = H;
			const padB = pad * scale;
			cx = W / 2;
			cy = H / 2;
			hw = Math.max(radius, W / 2 - padB);
			hh = Math.max(radius, H / 2 - padB);
			bandCache.width = W;
			bandCache.height = H;
			paintBand();
		};

		const ro = new ResizeObserver(resize);
		ro.observe(canvas);
		resize();

		if (reduce) {
			ctx.drawImage(bandCache, 0, 0);
			return () => ro.disconnect();
		}

		let seed = Date.now() & 0x7fffffff || 1;
		const rand = () => {
			seed = (Math.imul(seed, 48271) + 1) & 0x7fffffff;
			return seed / 0x7fffffff;
		};

		type P = {
			x: number;
			y: number;
			vx: number;
			vy: number;
			life: number;
			ttl: number;
			ph: number;
		};
		const particles: P[] = [];
		const MAX = 70;

		const spawn = (): P => {
			const ang = rand() * Math.PI * 2;
			const px = cx + Math.cos(ang) * (hw + 1);
			const py = cy + Math.sin(ang) * (hh + 1);
			const e = 0.6;
			const nx = sdf(px + e, py) - sdf(px - e, py);
			const ny = sdf(px, py + e) - sdf(px, py - e);
			const len = Math.hypot(nx, ny) || 1;
			const ox = nx / len;
			const oy = ny / len;
			const d0 = sdf(px, py);
			const speed = 1.5 + rand() * 1.5; // backing px/sec — very slow
			const ttl = 4 + rand() * 2;
			return {
				x: px - ox * d0,
				y: py - oy * d0,
				vx: ox * speed,
				vy: oy * speed,
				life: ttl,
				ttl,
				ph: (rand() * 16) | 0,
			};
		};

		let raf = 0;
		let last = 0;
		let acc = 0;
		let spawnAcc = 0;
		const FRAME = 1 / 24;

		const loop = (now: number) => {
			raf = requestAnimationFrame(loop);
			if (!last) last = now;
			let dt = (now - last) / 1000;
			last = now;
			if (dt > 0.1) dt = 0.1;
			acc += dt;
			if (acc < FRAME) return;
			const fdt = acc;
			acc = 0;

			ctx.clearRect(0, 0, W, H);
			ctx.drawImage(bandCache, 0, 0);

			spawnAcc = Math.min(spawnAcc + fdt * 14, 4);
			while (spawnAcc >= 1 && particles.length < MAX) {
				spawnAcc -= 1;
				particles.push(spawn());
			}

			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				p.life -= fdt;
				if (p.life <= 0) {
					particles.splice(i, 1);
					continue;
				}
				p.x += p.vx * fdt;
				p.y += p.vy * fdt;
				const r = p.life / p.ttl;
				const fade = r < 0.85 ? r / 0.85 : (1 - r) / 0.15;
				const ix = Math.round(p.x);
				const iy = Math.round(p.y);
				if (fade <= BAYER[(iy + p.ph) & 3][(ix + p.ph) & 3]) continue;
				ctx.fillStyle = `rgba(${R},${G},${B},${0.36 * fade})`;
				ctx.fillRect(ix, iy, 1, 1);
			}
		};
		raf = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	}, [pad]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden
			className={cn("pointer-events-none absolute -z-10", className)}
			style={{ inset: `-${pad}px`, imageRendering: "pixelated" }}
		/>
	);
}
