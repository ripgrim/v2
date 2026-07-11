import type { DitherColor } from "#/components/charts/dither-chart";
import type { AutomodStats } from "#/lib/automod.types";
import type { ModStats } from "#/lib/moderation.types";

export type AnalyticsSource = "moderation" | "automod";

export type AnalyticsMetric = {
	key: string;
	label: string;
	color: DitherColor;
	series: number[];
	delta: number;
	invertDelta?: boolean;
	suffix?: string;
};

export function moderationMetrics(stats: ModStats): AnalyticsMetric[] {
	return [
		{
			key: "pending",
			label: "Pending reports",
			color: "red",
			series: stats.pendingReports.series,
			delta: stats.pendingReports.delta,
			invertDelta: true,
		},
		{
			key: "resolved",
			label: "Resolved today",
			color: "blue",
			series: stats.resolvedToday.series,
			delta: stats.resolvedToday.delta,
		},
		{
			key: "automod",
			label: "Automod hits · 24h",
			color: "purple",
			series: stats.automodHits24h.series,
			delta: stats.automodHits24h.delta,
			invertDelta: true,
		},
		{
			key: "banned",
			label: "Banned users",
			color: "orange",
			series: stats.bannedUsers.series,
			delta: stats.bannedUsers.delta,
		},
	];
}

export function automodMetrics(stats: AutomodStats): AnalyticsMetric[] {
	return [
		{
			key: "rules",
			label: "Active rules",
			color: "blue",
			series: stats.activeRules.series,
			delta: stats.activeRules.delta,
		},
		{
			key: "matches",
			label: "Matches · 24h",
			color: "purple",
			series: stats.matches24h.series,
			delta: stats.matches24h.delta,
			invertDelta: true,
		},
		{
			key: "fp",
			label: "False-positive rate",
			color: "pink",
			series: stats.falsePositiveRate.series,
			delta: stats.falsePositiveRate.delta,
			invertDelta: true,
			suffix: "%",
		},
		{
			key: "actioned",
			label: "Auto-actioned · 24h",
			color: "orange",
			series: stats.autoActioned24h.series,
			delta: stats.autoActioned24h.delta,
		},
	];
}

/** A point's age in whole hours, mapped over a 24h window. */
export function hoursAgo(index: number, length: number): number {
	const span = 24;
	return Math.round(((length - 1 - index) / Math.max(length - 1, 1)) * span);
}
