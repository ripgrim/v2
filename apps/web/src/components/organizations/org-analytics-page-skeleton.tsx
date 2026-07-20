import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";

const STAT_SLOTS = [
	{ key: "a", value: "w-8" },
	{ key: "b", value: "w-10" },
	{ key: "c", value: "w-12" },
	{ key: "d", value: "w-8" },
	{ key: "e", value: "w-10" },
] as const;

function StatCardSkeleton({ value }: { value: string }) {
	return (
		<div className="overflow-hidden rounded-xl bg-card">
			<div className="flex flex-col gap-1.5 px-3.5 pt-3.5 pb-2.5">
				<Skeleton className="h-3 w-16" />
				<Skeleton className={`h-6 ${value}`} />
			</div>
			<div className="relative h-11">
				<Skeleton className="absolute inset-0 rounded-none" />
			</div>
		</div>
	);
}

export function StatGridSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-5">
			{STAT_SLOTS.map((slot) => (
				<StatCardSkeleton key={slot.key} value={slot.value} />
			))}
		</div>
	);
}

export function OrgAnalyticsPageSkeleton() {
	return (
		<DashboardLayout counts={{}}>
			<div className="px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
					<header className="flex flex-col gap-1.5">
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-4 w-80" />
					</header>
					<StatGridSkeleton />
				</div>
			</div>
		</DashboardLayout>
	);
}
