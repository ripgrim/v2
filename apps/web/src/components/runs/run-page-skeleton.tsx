import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";
import { currentUserQueryOptions } from "#/lib/auth.query";

const STEP_SLOTS = [
	{ key: "a", line: "w-40" },
	{ key: "b", line: "w-56" },
	{ key: "c", line: "w-32" },
	{ key: "d", line: "w-48" },
	{ key: "e", line: "w-36" },
	{ key: "f", line: "w-52" },
];

function RunSkeletonBody() {
	return (
		<div className="mx-auto w-full max-w-3xl px-6 py-8">
			<header className="mb-6">
				<div className="flex items-center gap-3">
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
				<Skeleton className="mt-2 h-4 w-64" />
			</header>
			<section className="overflow-hidden rounded-xl border bg-card">
				<div className="bg-surface-1 px-4 py-2.5">
					<Skeleton className="h-3 w-10" />
				</div>
				{STEP_SLOTS.map((slot) => (
					<div className="flex items-center gap-3 px-4 py-3" key={slot.key}>
						<Skeleton className="size-2 shrink-0 rounded-full" />
						<span className="flex min-w-0 flex-1 items-center">
							<Skeleton className={`h-4 ${slot.line}`} />
						</span>
						<Skeleton className="h-5 w-14 shrink-0 rounded-full" />
					</div>
				))}
			</section>
		</div>
	);
}

export function RunPageSkeleton() {
	const { data: user } = useQuery(currentUserQueryOptions());
	if (user) {
		return (
			<DashboardLayout counts={{}}>
				<RunSkeletonBody />
			</DashboardLayout>
		);
	}
	return (
		<div className="min-h-dvh bg-background">
			<RunSkeletonBody />
		</div>
	);
}
