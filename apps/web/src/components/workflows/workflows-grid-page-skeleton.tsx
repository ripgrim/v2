import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";

const CARD_SLOTS = [
	{ key: "a", name: "w-40", meta: "w-2/3" },
	{ key: "b", name: "w-32", meta: "w-1/2" },
	{ key: "c", name: "w-48", meta: "w-2/3" },
	{ key: "d", name: "w-36", meta: "w-1/2" },
] as const;

function WorkflowCardSkeleton({ name, meta }: { name: string; meta: string }) {
	return (
		<div className="flex flex-col rounded-xl border bg-card shadow-sm">
			<div className="flex flex-col gap-3 p-5">
				<div className="flex items-start justify-between gap-3">
					<Skeleton className={`h-4 ${name}`} />
					<div className="flex shrink-0 items-center gap-1">
						<Skeleton className="h-4 w-8 rounded-full" />
						<Skeleton className="size-7" />
					</div>
				</div>
				<Skeleton className={`h-3 ${meta}`} />
				<Skeleton className="h-3 w-24" />
			</div>
		</div>
	);
}

export function GridSkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{CARD_SLOTS.map((slot) => (
				<WorkflowCardSkeleton
					key={slot.key}
					meta={slot.meta}
					name={slot.name}
				/>
			))}
		</div>
	);
}

export function WorkflowsGridPageSkeleton() {
	return (
		<DashboardLayout counts={{}}>
			<div className="px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
					<header className="flex items-start justify-between gap-4">
						<div className="flex flex-col gap-1.5">
							<Skeleton className="h-6 w-36" />
							<Skeleton className="h-4 w-80" />
						</div>
						<Skeleton className="h-8 w-36 shrink-0" />
					</header>
					<GridSkeleton />
				</div>
			</div>
		</DashboardLayout>
	);
}
