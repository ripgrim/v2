import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";

const ROW_SLOTS = [
	{ key: "a", name: "w-40", meta: "w-2/3" },
	{ key: "b", name: "w-56", meta: "w-1/2" },
	{ key: "c", name: "w-32", meta: "w-2/3" },
	{ key: "d", name: "w-48", meta: "w-40" },
	{ key: "e", name: "w-36", meta: "w-1/2" },
] as const;

function RepoRowSkeleton({ name, meta }: { name: string; meta: string }) {
	return (
		<div className="rounded-lg px-3 py-3">
			<div className="flex items-center gap-3">
				<Skeleton className="size-3 shrink-0 rounded-full" />
				<div className="flex min-w-0 flex-1 flex-col gap-1.5">
					<Skeleton className={`h-4 ${name}`} />
					<Skeleton className={`h-3 ${meta}`} />
				</div>
				<Skeleton className="h-5 w-20 shrink-0 rounded-full" />
			</div>
		</div>
	);
}

export function HomeListSkeleton() {
	return (
		<div className="flex flex-col gap-1">
			{ROW_SLOTS.map((slot) => (
				<RepoRowSkeleton key={slot.key} meta={slot.meta} name={slot.name} />
			))}
		</div>
	);
}

export function OrgHomePageSkeleton() {
	return (
		<DashboardLayout counts={{}}>
			<div className="px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
					<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<header className="flex flex-col gap-1.5">
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-4 w-80" />
						</header>
						<div className="flex items-center gap-1">
							<Skeleton className="h-8 w-28" />
							<Skeleton className="h-8 w-24" />
						</div>
					</div>
					<HomeListSkeleton />
				</div>
			</div>
		</DashboardLayout>
	);
}
