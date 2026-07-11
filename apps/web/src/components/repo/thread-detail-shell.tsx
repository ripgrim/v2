import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { AnalyticsMetricsSheet } from "#/components/analytics/analytics-metrics-sheet";
import { MetricDetailChart } from "#/components/analytics/metric-detail-chart";
import { RepoMetricCard } from "#/components/analytics/repo-metric-card";
import type { ThreadAnalytics } from "#/lib/repo-analytics.types";

/**
 * The shared frame for an issue/PR conversation: a scroll area for the thread
 * plus a bottom "Show analytics" sheet that rises into view (mirroring the
 * analytics route's metrics sheet) and links through to the full analytics
 * counterpart — keeping the conversation and its analytics one motion apart.
 */
export function ThreadDetailShell({
	org,
	repo,
	id,
	kind,
	analytics,
	children,
}: {
	org: string;
	repo: string;
	id: string;
	kind: "issue" | "pull";
	analytics?: ThreadAnalytics;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const [focusedKey, setFocusedKey] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const restoreTop = useRef(0);
	const prevOpen = useRef(false);

	const focused =
		analytics?.metrics.find((m) => m.key === focusedKey) ??
		analytics?.metrics[0];

	// Opening the sheet rides the scroll to the bottom (page slides up); closing
	// glides it back to where it was opened from.
	useEffect(() => {
		const el = scrollRef.current;
		const opening = open && !prevOpen.current;
		const closing = !open && prevOpen.current;
		prevOpen.current = open;
		if (!el || (!opening && !closing)) return;

		if (opening) restoreTop.current = el.scrollTop;
		const target = opening ? () => el.scrollHeight : () => restoreTop.current;
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			start ||= now;
			el.scrollTop = target();
			if (now - start < 520) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [open]);

	return (
		<div className="relative flex h-full flex-col">
			<div
				ref={scrollRef}
				className="overflow-stable min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-10"
			>
				{children}
			</div>

			{analytics ? (
				<AnalyticsMetricsSheet
					open={open}
					onOpenChange={setOpen}
					metricCount={analytics.metrics.length}
					openLabel="Show analytics"
					closeLabel="Hide analytics"
				>
					<div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8">
						<div className="mb-4 flex items-center justify-between gap-3">
							<h3 className="font-semibold text-foreground text-sm">
								Thread analytics
							</h3>
							<FullAnalyticsLink org={org} repo={repo} id={id} kind={kind} />
						</div>

						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							{analytics.metrics.map((m) => (
								<RepoMetricCard
									key={m.key}
									metric={m}
									focused={m.key === focused?.key}
									onClick={() => setFocusedKey(m.key)}
								/>
							))}
						</div>

						{focused ? (
							<div className="mt-4">
								<MetricDetailChart metric={focused} height={132} />
							</div>
						) : null}
					</div>
				</AnalyticsMetricsSheet>
			) : null}
		</div>
	);
}

function FullAnalyticsLink({
	org,
	repo,
	id,
	kind,
}: {
	org: string;
	repo: string;
	id: string;
	kind: "issue" | "pull";
}) {
	const className =
		"flex items-center gap-1 font-medium text-[13px] text-brand transition-opacity hover:opacity-80";
	if (kind === "issue") {
		return (
			<Link
				to="/$org/$repo/analytics/issues/$id"
				params={{ org, repo, id }}
				className={className}
			>
				View full analytics
				<ArrowUpRight size={14} strokeWidth={2} />
			</Link>
		);
	}
	return (
		<Link
			to="/$org/$repo/analytics/pulls/$id"
			params={{ org, repo, id }}
			className={className}
		>
			View full analytics
			<ArrowUpRight size={14} strokeWidth={2} />
		</Link>
	);
}
