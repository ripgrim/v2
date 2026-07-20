import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";

export function ModerationPageSkeleton() {
	return (
		<DashboardLayout counts={{}}>
			<div className="px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
					<header className="flex flex-col gap-1.5">
						<Skeleton className="h-6 w-36" />
						<Skeleton className="h-4 w-72" />
					</header>
					<PanelSkeleton />
					<QueueSkeleton />
				</div>
			</div>
		</DashboardLayout>
	);
}

const CARD_SLOTS = [
	{ key: "review", label: "w-24", value: "w-10" },
	{ key: "blocked", label: "w-20", value: "w-8" },
	{ key: "passed", label: "w-16", value: "w-12" },
];

const QUEUE_SLOTS = [
	{ key: "a", title: "w-2/3", meta: "w-40" },
	{ key: "b", title: "w-1/2", meta: "w-32" },
	{ key: "c", title: "w-3/5", meta: "w-44" },
	{ key: "d", title: "w-2/5", meta: "w-36" },
	{ key: "e", title: "w-1/2", meta: "w-28" },
	{ key: "f", title: "w-2/3", meta: "w-40" },
];

export function PanelSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{CARD_SLOTS.map((slot) => (
				<div className="overflow-hidden rounded-xl bg-card" key={slot.key}>
					<div className="flex flex-col gap-1.5 px-3.5 pt-3.5 pb-2.5">
						<Skeleton className={`h-3 ${slot.label}`} />
						<Skeleton className={`h-6 ${slot.value}`} />
					</div>
					<div className="flex h-11 items-end">
						<Skeleton className="h-7 w-full rounded-none" />
					</div>
				</div>
			))}
		</div>
	);
}

export function QueueSkeleton() {
	return (
		<div className="flex flex-col gap-2">
			<Skeleton className="h-4 w-24" />
			{QUEUE_SLOTS.map((slot) => (
				<div
					className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
					key={slot.key}
				>
					<div className="flex min-w-0 flex-1 flex-col gap-1.5">
						<Skeleton className={`h-4 ${slot.title}`} />
						<Skeleton className={`h-3 ${slot.meta}`} />
					</div>
					<Skeleton className="h-7 w-16 shrink-0" />
					<Skeleton className="h-7 w-12 shrink-0" />
				</div>
			))}
		</div>
	);
}
