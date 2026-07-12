import type { DitherColor } from "#/components/charts/dither-chart";
import type { ModStats } from "#/lib/moderation.types";

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

/** A point's age in whole hours, mapped over a 24h window. */
export function hoursAgo(index: number, length: number): number {
	const span = 24;
	return Math.round(((length - 1 - index) / Math.max(length - 1, 1)) * span);
}
