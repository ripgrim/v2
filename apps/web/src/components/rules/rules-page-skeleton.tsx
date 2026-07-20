import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";

const STAT_SLOTS = [
	{ key: "active", label: "w-20", value: "w-8" },
	{ key: "matches", label: "w-24", value: "w-10" },
	{ key: "actioned", label: "w-24", value: "w-8" },
	{ key: "fp", label: "w-14", value: "w-28" },
];

const RULE_SLOTS = [
	{ key: "a", name: "w-32", body: "w-3/4" },
	{ key: "b", name: "w-40", body: "w-2/3" },
	{ key: "c", name: "w-24", body: "w-1/2" },
	{ key: "d", name: "w-36", body: "w-3/5" },
	{ key: "e", name: "w-28", body: "w-2/3" },
];

export function RulesPageSkeleton() {
	return (
		<DashboardLayout counts={{}}>
			<div className="mx-auto w-full max-w-4xl px-6 py-8">
				<header className="mb-6 flex flex-col gap-1.5">
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-4 w-96 max-w-full" />
				</header>

				<div className="flex flex-col gap-6">
					<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
						{STAT_SLOTS.map((slot) => (
							<div
								className="overflow-hidden rounded-xl bg-card"
								key={slot.key}
							>
								<div className="flex flex-col gap-1.5 px-3.5 pt-3.5 pb-2.5">
									<Skeleton className={`h-3 ${slot.label}`} />
									<Skeleton className={`h-6 ${slot.value}`} />
								</div>
								<div className="h-11" />
							</div>
						))}
					</div>

					<div className="flex items-center justify-end">
						<Skeleton className="h-6 w-32" />
					</div>

					<div className="flex flex-col gap-3">
						{RULE_SLOTS.map((slot) => (
							<div
								className="overflow-hidden rounded-xl border bg-card"
								key={slot.key}
							>
								<div className="flex items-center gap-x-2.5 bg-surface-1 px-4 py-2">
									<Skeleton className={`h-4 ${slot.name}`} />
									<Skeleton className="h-3 w-10" />
									<div className="ml-auto flex shrink-0 items-center gap-4">
										<Skeleton className="hidden h-7 w-20 sm:block" />
										<div className="flex w-10 flex-col items-end gap-1">
											<Skeleton className="h-4 w-6" />
											<Skeleton className="h-3 w-8" />
										</div>
										<Skeleton className="h-5 w-9 rounded-full" />
									</div>
								</div>
								<div className="px-4 py-3">
									<Skeleton className={`h-3 ${slot.body}`} />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
