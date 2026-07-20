import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";

const FILTER_SLOTS = [
	{ key: "all", width: "w-10" },
	{ key: "blocked", width: "w-16" },
	{ key: "review", width: "w-24" },
	{ key: "passed", width: "w-14" },
	{ key: "no-run", width: "w-14" },
];

const STACK_SLOTS = [
	{
		key: "stack-a",
		title: "w-2/3",
		meta: "w-40",
		rows: [
			{ key: "r1", line: "w-48" },
			{ key: "r2", line: "w-64" },
			{ key: "r3", line: "w-40" },
		],
	},
	{
		key: "stack-b",
		title: "w-1/2",
		meta: "w-32",
		rows: [
			{ key: "r1", line: "w-56" },
			{ key: "r2", line: "w-44" },
		],
	},
];

const ROW_SLOTS = [
	{ key: "row-a", title: "w-1/2", meta: "w-36" },
	{ key: "row-b", title: "w-2/3", meta: "w-28" },
];

export function ActivityPageSkeleton() {
	return (
		<DashboardLayout counts={{}}>
			<div className="mx-auto w-full max-w-3xl px-6 py-8">
				<header className="mb-4 flex items-center justify-between">
					<div className="flex flex-col gap-1.5">
						<Skeleton className="h-6 w-28" />
						<Skeleton className="h-4 w-72" />
					</div>
					<Skeleton className="h-4 w-12 rounded-full" />
				</header>

				<div className="mb-4 flex flex-wrap gap-1.5">
					{FILTER_SLOTS.map((slot) => (
						<Skeleton
							className={`h-6 rounded-full ${slot.width}`}
							key={slot.key}
						/>
					))}
				</div>

				<div className="flex flex-col gap-3">
					{STACK_SLOTS.map((stack) => (
						<div
							className="overflow-hidden rounded-xl border bg-card"
							key={stack.key}
						>
							<div className="flex items-center gap-3 bg-surface-1 px-3.5 py-3">
								<div className="flex min-w-0 flex-1 flex-col gap-1.5">
									<Skeleton className={`h-4 ${stack.title}`} />
									<Skeleton className={`h-3 ${stack.meta}`} />
								</div>
								<Skeleton className="h-3 w-10 shrink-0" />
							</div>
							{stack.rows.map((row) => (
								<div
									className="flex items-center gap-3 px-3.5 py-2.5"
									key={row.key}
								>
									<Skeleton className="size-1.5 shrink-0 rounded-full" />
									<span className="flex min-w-0 flex-1 items-center">
										<Skeleton className={`h-3 ${row.line}`} />
									</span>
									<span className="flex w-[60px] shrink-0 justify-center">
										<Skeleton className="h-5 w-14 rounded-full" />
									</span>
									<span className="flex w-12 shrink-0 justify-end">
										<Skeleton className="h-3 w-8" />
									</span>
								</div>
							))}
						</div>
					))}
					{ROW_SLOTS.map((row) => (
						<div
							className="flex items-center gap-3 rounded-md px-3 py-2.5"
							key={row.key}
						>
							<Skeleton className="size-4 shrink-0" />
							<Skeleton className="size-5 shrink-0 rounded-full" />
							<div className="flex min-w-0 flex-1 flex-col gap-1.5">
								<Skeleton className={`h-4 ${row.title}`} />
								<Skeleton className={`h-3 ${row.meta}`} />
							</div>
							<Skeleton className="h-5 w-16 shrink-0 rounded-full" />
							<span className="flex w-14 shrink-0 justify-end">
								<Skeleton className="h-3 w-8" />
							</span>
						</div>
					))}
				</div>
			</div>
		</DashboardLayout>
	);
}
