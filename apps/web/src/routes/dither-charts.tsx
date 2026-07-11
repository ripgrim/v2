import { createFileRoute } from "@tanstack/react-router";
import { RefreshCcwIcon, ShuffleIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { DitherColor } from "#/components/charts/dither-kit";
import {
	ActiveDot,
	Area,
	AreaChart,
	type AreaVariant,
	Bar,
	BarChart,
	type ChartConfig,
	Dot,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	Radar,
	RadarChart,
	type StackType,
	Tooltip,
	XAxis,
	YAxis,
} from "#/components/charts/dither-kit";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/dither-charts")({
	ssr: false,
	component: DitherChartsDemo,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function seedData(shift: number) {
	return MONTHS.map((month, i) => ({
		month,
		desktop: Math.round(120 + 90 * Math.sin((i + shift) * 0.7) + i * 14),
		mobile: Math.round(70 + 50 * Math.cos((i + shift) * 0.5) + i * 8),
	}));
}

function singleData(amp: number, base: number, phase: number) {
	return MONTHS.map((month, i) => ({
		month,
		value: Math.round(base + amp * Math.sin((i + phase) * 0.8) + i * 6),
	}));
}

const config: ChartConfig = {
	desktop: { label: "Desktop", color: "blue" },
	mobile: { label: "Mobile", color: "purple" },
};

const pieData = [
	{ browser: "chrome", visitors: 275 },
	{ browser: "safari", visitors: 200 },
	{ browser: "firefox", visitors: 187 },
	{ browser: "edge", visitors: 120 },
	{ browser: "other", visitors: 90 },
];
const pieConfig: ChartConfig = {
	chrome: { label: "Chrome", color: "blue" },
	safari: { label: "Safari", color: "green" },
	firefox: { label: "Firefox", color: "orange" },
	edge: { label: "Edge", color: "purple" },
	other: { label: "Other", color: "grey" },
};

const radarData = [
	{ skill: "Speed", desktop: 186, mobile: 120 },
	{ skill: "Power", desktop: 205, mobile: 98 },
	{ skill: "Range", desktop: 137, mobile: 160 },
	{ skill: "Defense", desktop: 173, mobile: 125 },
	{ skill: "Magic", desktop: 160, mobile: 190 },
	{ skill: "Luck", desktop: 144, mobile: 110 },
];

const SINGLES: {
	color: DitherColor;
	variant: AreaVariant;
	amp: number;
	base: number;
	phase: number;
}[] = [
	{ color: "green", variant: "gradient", amp: 50, base: 90, phase: 0 },
	{ color: "orange", variant: "dotted", amp: 40, base: 70, phase: 2 },
	{ color: "pink", variant: "hatched", amp: 60, base: 110, phase: 4 },
];

type Section = "area" | "singles" | "bar" | "line" | "pie" | "radar";

function ReplayButton({ onClick }: { onClick: () => void }) {
	return (
		<Button variant="outline" size="xs" onClick={onClick}>
			<RefreshCcwIcon className="size-3 pixelated" />
			<span className="text-xs font-mono">replay</span>
		</Button>
	);
}

function DitherChartsDemo() {
	const [shift, setShift] = useState(0);
	const [stackType, setStackType] = useState<StackType>("stacked");
	// Stable refs so an unrelated re-render (e.g. one section's replay) doesn't
	// look like a data change to the other charts. Only `shift` rebuilds `data`.
	const data = useMemo(() => seedData(shift), [shift]);
	const singles = useMemo(
		() =>
			SINGLES.map((s) => ({ ...s, data: singleData(s.amp, s.base, s.phase) })),
		[],
	);

	// Bumping a section's token re-plays its chart's entrance (no remount).
	const [replays, setReplays] = useState<Record<Section, number>>({
		area: 0,
		singles: 0,
		bar: 0,
		line: 0,
		pie: 0,
		radar: 0,
	});
	const replay = (s: Section) => setReplays((r) => ({ ...r, [s]: r[s] + 1 }));

	// Bloom (glow) — live-tweakable blur / brightness / opacity / blend.
	const [bloomOn, setBloomOn] = useState(false);
	const [blur, setBlur] = useState(24);
	const [brightness, setBrightness] = useState(2.9);
	const [bloomOpacity, setBloomOpacity] = useState(0.1);
	const [saturate, setSaturate] = useState(3);
	const [blend, setBlend] = useState<"plus-lighter" | "screen" | "lighten">(
		"plus-lighter",
	);
	const [bloomOnHover, setBloomOnHover] = useState(false);
	const glow = {
		bloom: bloomOn
			? { blur, brightness, opacity: bloomOpacity, saturate, blend }
			: ("off" as const),
		bloomOnHover,
	};

	const counts = {
		queue: 0,
		automod: 0,
	};

	type Moderator = {
		name: string;
		login: string;
		image: string;
	};

	const moderator: Moderator = {
		name: "grim",
		login: "ripgrim",
		image: "https://github.com/ripgrim.png",
	};

	return (
		<DashboardLayout moderator={moderator} counts={counts}>
			<div className="h-full overflow-y-auto p-8 text-foreground">
				<div className="mx-auto flex max-w-3xl flex-col gap-6">
					<header className="flex items-center justify-between">
						<h1 className="font-mono text-lg">Dither charts — Area</h1>
						<div className="flex gap-2 font-mono text-xs">
							<Button
								type="button"
								variant="outline"
								size="xs"
								onClick={() => setShift((s) => s + 1)}
							>
								<ShuffleIcon className="size-3 pixelated" />
								<span className="text-xs font-mono">shuffle data</span>
							</Button>
							<Button
								type="button"
								variant="outline"
								size="xs"
								onClick={() =>
									setStackType((t) => (t === "default" ? "stacked" : "default"))
								}
							>
								{stackType}
							</Button>
							<Button
								type="button"
								variant={bloomOn ? "default" : "outline"}
								size="xs"
								onClick={() => setBloomOn((v) => !v)}
							>
								<span className="font-mono text-xs">bloom</span>
							</Button>
							<Button
								type="button"
								variant={bloomOnHover ? "default" : "outline"}
								size="xs"
								onClick={() => setBloomOnHover((v) => !v)}
							>
								<span className="font-mono text-xs">on hover</span>
							</Button>
							<ReplayButton onClick={() => replay("area")} />
						</div>
					</header>

					{bloomOn && (
						<div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border bg-card/40 px-4 py-3 font-mono text-muted-foreground text-xs">
							<label className="flex items-center gap-2">
								blur
								<input
									type="range"
									min={0}
									max={24}
									step={0.5}
									value={blur}
									onChange={(e) => setBlur(Number(e.target.value))}
								/>
								<span className="w-10 tabular-nums text-foreground">
									{blur}px
								</span>
							</label>
							<label className="flex items-center gap-2">
								brightness
								<input
									type="range"
									min={1}
									max={3}
									step={0.05}
									value={brightness}
									onChange={(e) => setBrightness(Number(e.target.value))}
								/>
								<span className="w-8 tabular-nums text-foreground">
									{brightness.toFixed(2)}
								</span>
							</label>
							<label className="flex items-center gap-2">
								opacity
								<input
									type="range"
									min={0}
									max={1}
									step={0.05}
									value={bloomOpacity}
									onChange={(e) => setBloomOpacity(Number(e.target.value))}
								/>
								<span className="w-8 tabular-nums text-foreground">
									{bloomOpacity.toFixed(2)}
								</span>
							</label>
							<label className="flex items-center gap-2">
								color
								<input
									type="range"
									min={0}
									max={3}
									step={0.05}
									value={saturate}
									onChange={(e) => setSaturate(Number(e.target.value))}
								/>
								<span className="w-8 tabular-nums text-foreground">
									{saturate.toFixed(2)}
								</span>
							</label>
							<label className="flex items-center gap-2">
								blend
								<select
									className="rounded border bg-card px-1.5 py-0.5 text-foreground"
									value={blend}
									onChange={(e) =>
										setBlend(
											e.target.value as "plus-lighter" | "screen" | "lighten",
										)
									}
								>
									<option value="plus-lighter">plus-lighter</option>
									<option value="screen">screen</option>
									<option value="lighten">lighten</option>
								</select>
							</label>
						</div>
					)}

					<div className="h-72 w-full rounded-lg p-4">
						<AreaChart
							{...glow}
							replayToken={replays.area}
							data={data}
							config={config}
							stackType={stackType}
						>
							<XAxis dataKey="month" />
							<YAxis />
							<Legend isClickable />
							<Tooltip labelKey="month" />
							<Area
								dataKey="desktop"
								variant="gradient"
								strokeVariant="dashed"
								isClickable
							>
								<ActiveDot variant="colored-border" />
							</Area>
							<Area dataKey="mobile" variant="hatched" isClickable>
								<Dot variant="border" />
								<ActiveDot variant="colored-border" />
							</Area>
						</AreaChart>
					</div>

					<p className="font-mono text-muted-foreground text-xs">
						Hover to scrub · click a series or legend entry to select · toggle
						stacked · shuffle to see the shape ease.
					</p>

					<div className="mt-4 flex items-center justify-between">
						<h2 className="font-mono text-muted-foreground text-sm">
							Single series
						</h2>
						<ReplayButton onClick={() => replay("singles")} />
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{singles.map((s) => (
							<div key={s.color} className="h-40 rounded-lg  p-3">
								<AreaChart
									{...glow}
									replayToken={replays.singles}
									data={s.data}
									config={{ value: { label: s.color, color: s.color } }}
									margins={{ top: 8, right: 8, bottom: 18, left: 8 }}
								>
									<XAxis dataKey="month" maxTicks={4} />
									<Tooltip labelKey="month" />
									<Area dataKey="value" variant={s.variant}>
										<ActiveDot variant="colored-border" />
									</Area>
								</AreaChart>
							</div>
						))}
					</div>

					<div className="mt-4 flex items-center justify-between">
						<h2 className="font-mono text-muted-foreground text-sm">
							Bar — grouped &amp; stacked share the {stackType} toggle
						</h2>
						<ReplayButton onClick={() => replay("bar")} />
					</div>
					<div className="h-64 w-full rounded-lg  p-4">
						<BarChart
							{...glow}
							replayToken={replays.bar}
							data={data}
							config={config}
							stackType={stackType}
						>
							<XAxis dataKey="month" />
							<YAxis />
							<Legend isClickable />
							<Tooltip labelKey="month" />
							<Bar dataKey="desktop" variant="gradient" isClickable />
							<Bar dataKey="mobile" variant="hatched" isClickable />
						</BarChart>
					</div>

					<div className="mt-4 flex items-center justify-between">
						<h2 className="font-mono text-muted-foreground text-sm">
							Line — bright line with a dither glow
						</h2>
						<ReplayButton onClick={() => replay("line")} />
					</div>
					<div className="h-64 w-full rounded-lg  p-4">
						<LineChart
							{...glow}
							replayToken={replays.line}
							data={data}
							config={config}
						>
							<XAxis dataKey="month" />
							<YAxis />
							<Legend isClickable />
							<Tooltip labelKey="month" />
							<Line dataKey="desktop" strokeVariant="solid" isClickable>
								<ActiveDot variant="colored-border" />
							</Line>
							<Line dataKey="mobile" strokeVariant="dashed" isClickable>
								<ActiveDot variant="colored-border" />
							</Line>
						</LineChart>
					</div>

					<h2 className="mt-4 font-mono text-muted-foreground text-sm">
						Pie / donut &amp; Radar — polar dither
					</h2>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<div className="flex justify-end">
								<ReplayButton onClick={() => replay("pie")} />
							</div>
							<div className="h-72 rounded-lg  p-4">
								<PieChart
									{...glow}
									replayToken={replays.pie}
									data={pieData}
									config={pieConfig}
									dataKey="visitors"
									nameKey="browser"
									innerRadius={0.5}
								>
									<Legend isClickable align="center" />
									<Tooltip />
									<Pie variant="gradient" />
								</PieChart>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<div className="flex justify-end">
								<ReplayButton onClick={() => replay("radar")} />
							</div>
							<div className="h-72 rounded-lg  p-4">
								<RadarChart
									{...glow}
									replayToken={replays.radar}
									data={radarData}
									config={config}
									nameKey="skill"
								>
									<Legend isClickable align="center" />
									<Tooltip />
									<Radar dataKey="desktop" variant="gradient" />
									<Radar dataKey="mobile" variant="hatched" />
								</RadarChart>
							</div>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
