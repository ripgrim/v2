import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";

const EVENT_SLOTS = [
	{ key: "a", title: "w-1/2", meta: "w-40" },
	{ key: "b", title: "w-2/3", meta: "w-32" },
	{ key: "c", title: "w-2/5", meta: "w-44" },
	{ key: "d", title: "w-3/5", meta: "w-36" },
	{ key: "e", title: "w-1/2", meta: "w-28" },
];

export function AnalyticsPageSkeleton() {
	return (
		<DashboardLayout counts={{}}>
			<div className="relative flex h-full flex-col">
				<div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-8 md:py-10">
					<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
						<Skeleton className="h-4 w-36" />

						<header className="flex flex-col gap-1">
							<Skeleton className="h-3 w-24" />
							<div className="flex items-baseline gap-2">
								<Skeleton className="h-9 w-24" />
								<Skeleton className="h-3 w-8" />
							</div>
						</header>

						<div className="h-56 md:-mx-6">
							<Skeleton className="size-full rounded-lg" />
						</div>

						<section className="flex flex-col gap-3">
							<div className="flex items-center gap-2 px-3">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-8 rounded-full" />
							</div>
							<div className="flex flex-col">
								{EVENT_SLOTS.map((slot) => (
									<div
										className="flex items-center gap-3 rounded-lg px-3 py-2.5"
										key={slot.key}
									>
										<Skeleton className="size-4 shrink-0 rounded-full" />
										<div className="flex min-w-0 flex-1 flex-col gap-1.5">
											<Skeleton className={`h-4 ${slot.title}`} />
											<Skeleton className={`h-3 ${slot.meta}`} />
										</div>
										<Skeleton className="h-3 w-10 shrink-0" />
									</div>
								))}
							</div>
						</section>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
