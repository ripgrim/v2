import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { AuthorLink } from "#/components/repo/author-link";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import { type BucketEvent, seedBucketActivity } from "#/lib/bucket-activity";
import type { RepoMetric } from "#/lib/repo-analytics.types";

const PAGE = 8;

/**
 * The activity behind a single chart bucket — the N comments that make up the
 * spike, with automod attribution, each traceable to its root thread/comment.
 */
export function ActivityDrilldown({
	org,
	repo,
	metric,
	bucketIndex,
	onClose,
}: {
	org: string;
	repo: string;
	metric: RepoMetric;
	bucketIndex: number;
	onClose: () => void;
}) {
	const count = Math.round(metric.series[bucketIndex] ?? 0);
	const events = useMemo(
		() => seedBucketActivity(metric.key, bucketIndex, count),
		[metric.key, bucketIndex, count],
	);
	const automod = events.filter((e) => e.automodHit != null).length;

	const [page, setPage] = useState(0);
	const pages = Math.max(1, Math.ceil(events.length / PAGE));
	const safePage = Math.min(page, pages - 1);
	const slice = events.slice(safePage * PAGE, safePage * PAGE + PAGE);

	return (
		<div className="flex w-full flex-col overflow-hidden md:h-full md:w-80 md:rounded-xl md:border md:bg-card">
			<header className="flex items-center justify-between gap-2 px-4 py-3">
				<span className="truncate text-[11px] text-muted-foreground">
					{metric.label} · point {bucketIndex + 1}
				</span>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close"
					className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-1 hover:text-foreground"
				>
					<HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
				</button>
			</header>

			<Separator />

			<div className="flex flex-col gap-0.5 px-4 py-3">
				<span className="font-semibold text-2xl text-foreground tabular-nums">
					{count.toLocaleString()}
					{metric.suffix ?? ""}
				</span>
				<span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
					<ShieldCheck size={13} strokeWidth={2} className="text-amber-500" />
					automod caught {automod} of {count}
				</span>
			</div>

			<Separator />

			<div className="flex flex-1 flex-col overflow-y-auto">
				{slice.map((event) => (
					<EventRow key={event.id} org={org} repo={repo} event={event} />
				))}
				{events.length === 0 ? (
					<p className="px-4 py-10 text-center text-muted-foreground text-xs">
						No activity in this bucket.
					</p>
				) : null}
			</div>

			{pages > 1 ? (
				<>
					<Separator />
					<footer className="flex items-center justify-between gap-2 px-3 py-2.5">
						<Button
							variant="outline"
							size="sm"
							disabled={safePage === 0}
							onClick={() => setPage(safePage - 1)}
							iconLeft={<ChevronLeft size={13} strokeWidth={2} />}
						>
							Prev
						</Button>
						<span className="text-[11px] text-muted-foreground tabular-nums">
							{safePage + 1} / {pages}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={safePage >= pages - 1}
							onClick={() => setPage(safePage + 1)}
							iconRight={<ChevronRight size={13} strokeWidth={2} />}
						>
							Next
						</Button>
					</footer>
				</>
			) : null}
		</div>
	);
}

function EventRow({
	org,
	repo,
	event,
}: {
	org: string;
	repo: string;
	event: BucketEvent;
}) {
	const body = (
		<>
			<img
				src={`https://github.com/${event.author}.png`}
				alt={event.author}
				className="mt-0.5 size-5 shrink-0 rounded-full border border-border bg-surface-2"
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<p className="line-clamp-2 text-[12px] text-foreground">
					{event.snippet}
				</p>
				{event.automodHit ? (
					<span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/12 px-1.5 py-0.5 font-medium text-[10px] text-amber-400">
						automod · {event.automodHit}
					</span>
				) : (
					<span className="text-[10px] text-muted-foreground">passed</span>
				)}
			</div>
		</>
	);

	const className =
		"flex items-start gap-2.5 border-border border-b px-4 py-2.5 transition-colors hover:bg-muted";

	// Author chip sits above the body so it's a separate link from the row link.
	const author = (
		<AuthorLink
			org={org}
			repo={repo}
			login={event.author}
			at
			className="font-medium text-[11px] text-muted-foreground"
		/>
	);

	if (event.link) {
		return (
			<div className="flex flex-col gap-1 border-border border-b px-4 py-2.5 transition-colors hover:bg-muted">
				{author}
				<RootLink org={org} repo={repo} link={event.link}>
					{body}
				</RootLink>
			</div>
		);
	}
	if (event.softLink) {
		const to =
			event.softLink.threadKind === "issue"
				? "/$org/$repo/issues/$id"
				: "/$org/$repo/pulls/$id";
		return (
			<div className="flex flex-col gap-1 border-border border-b px-4 py-2.5 transition-colors hover:bg-muted">
				{author}
				<Link
					to={to}
					params={{ org, repo, id: String(event.softLink.threadNumber) }}
					className="flex items-start gap-2.5"
				>
					{body}
				</Link>
			</div>
		);
	}
	return (
		<div className={`${className} flex-col gap-1`}>
			{author}
			<div className="flex items-start gap-2.5">{body}</div>
		</div>
	);
}

function RootLink({
	org,
	repo,
	link,
	children,
}: {
	org: string;
	repo: string;
	link: NonNullable<BucketEvent["link"]>;
	children: React.ReactNode;
}) {
	const params = { org, repo, id: String(link.threadNumber) };
	const search = { c: link.commentId };
	if (link.threadKind === "issue") {
		return (
			<Link
				to="/$org/$repo/issues/$id"
				params={params}
				search={search}
				className="flex items-start gap-2.5"
			>
				{children}
			</Link>
		);
	}
	return (
		<Link
			to="/$org/$repo/pulls/$id"
			params={params}
			search={search}
			className="flex items-start gap-2.5"
		>
			{children}
		</Link>
	);
}
