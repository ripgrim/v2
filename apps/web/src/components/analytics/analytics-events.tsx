import {
	Alert02Icon,
	AnalyticsDownIcon,
	AnalyticsUpIcon,
	ArrowDownRight01Icon,
	ArrowUpRight01Icon,
	PackageAddIcon,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
	AnalyticsEvent,
	EventImpact,
	EventKind,
} from "#/lib/analytics-events";
import { formatRelativeTime } from "#/lib/format-relative-time";
import { cn } from "#/lib/utils";

const KIND_ICON: Record<EventKind, IconSvgElement> = {
	spike: AnalyticsUpIcon,
	drop: AnalyticsDownIcon,
	rule: SparklesIcon,
	ban: SparklesIcon,
	deploy: PackageAddIcon,
	resolve: SparklesIcon,
	report: Alert02Icon,
};

/** Order with `focusedId` swapped into the top slot. */
function withFocusedOnTop(ids: string[], focusedId?: string | null): string[] {
	if (!focusedId) return ids;
	const i = ids.indexOf(focusedId);
	if (i <= 0) return ids;
	const next = [...ids];
	[next[0], next[i]] = [next[i], next[0]];
	return next;
}

export function AnalyticsEvents({
	events,
	focusedId,
	hideHeader,
}: {
	events: AnalyticsEvent[];
	focusedId?: string | null;
	/** Hide the inline title — e.g. when a sheet handle already labels it. */
	hideHeader?: boolean;
}) {
	// Hold the display order in state so the focused event can swap up to the
	// top, trading places with whatever was there — and stay put afterward.
	const [order, setOrder] = useState<string[]>(() =>
		withFocusedOnTop(
			events.map((e) => e.id),
			focusedId,
		),
	);
	const eventsRef = useRef(events);

	// Reset to the natural order (focused on top) when the metric set changes.
	useEffect(() => {
		if (eventsRef.current !== events) {
			eventsRef.current = events;
			setOrder(
				withFocusedOnTop(
					events.map((e) => e.id),
					focusedId,
				),
			);
		}
	}, [events, focusedId]);

	// Swap the focused event to the top within the current set.
	useEffect(() => {
		setOrder((prev) => withFocusedOnTop(prev, focusedId));
	}, [focusedId]);

	const byId = useMemo(
		() => new Map(events.map((e) => [e.id, e] as const)),
		[events],
	);
	const ordered = order
		.map((id) => byId.get(id))
		.filter((e): e is AnalyticsEvent => Boolean(e));

	return (
		<section className="flex flex-col gap-3">
			{hideHeader ? null : (
				<div className="flex items-center gap-2 px-3">
					<h2 className="font-semibold text-sm tracking-tight">Activity</h2>
					<span className="rounded-full bg-surface-1 px-2 py-0.5 font-medium text-[11px] text-muted-foreground tabular-nums">
						{events.length}
					</span>
				</div>
			)}

			{ordered.length === 0 ? (
				<p className="px-3 py-10 text-center text-muted-foreground text-sm">
					no activity yet — it fills in as tripwire runs on this metric.
				</p>
			) : (
				<div className="flex flex-col">
					{ordered.map((event) => (
						<EventRow
							key={event.id}
							event={event}
							focused={event.id === focusedId}
						/>
					))}
				</div>
			)}
		</section>
	);
}

function EventRow({
	event,
	focused,
}: {
	event: AnalyticsEvent;
	focused: boolean;
}) {
	const Icon = KIND_ICON[event.kind];
	return (
		<motion.div
			layout
			transition={{ type: "spring", stiffness: 480, damping: 42 }}
			className={cn(
				"flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
				focused ? "bg-muted" : "hover:bg-muted",
			)}
		>
			<HugeiconsIcon
				icon={Icon}
				size={15}
				strokeWidth={2}
				className="shrink-0 text-muted-foreground"
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<p className="truncate text-sm font-medium">{event.title}</p>
				<p className="truncate text-xs text-muted-foreground">
					{event.detail} · {formatRelativeTime(event.at)}
				</p>
			</div>
			{event.impact ? <ImpactChip impact={event.impact} /> : null}
		</motion.div>
	);
}

function ImpactChip({ impact }: { impact: EventImpact }) {
	const tone =
		impact.tone === "down"
			? "text-emerald-600 dark:text-emerald-400"
			: impact.tone === "up"
				? "text-amber-600 dark:text-amber-400"
				: "text-muted-foreground";
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-1 font-medium text-[11px] tabular-nums",
				tone,
			)}
		>
			{impact.tone === "up" ? (
				<HugeiconsIcon icon={ArrowUpRight01Icon} size={12} strokeWidth={2.25} />
			) : impact.tone === "down" ? (
				<HugeiconsIcon
					icon={ArrowDownRight01Icon}
					size={12}
					strokeWidth={2.25}
				/>
			) : null}
			{impact.label}
		</span>
	);
}
