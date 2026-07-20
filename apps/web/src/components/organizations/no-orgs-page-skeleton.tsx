import { Skeleton } from "#/components/ui/skeleton";

export function NoOrgsPageSkeleton() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-background px-6">
			<div className="flex w-full max-w-sm flex-col gap-5 rounded-xl bg-card px-6 py-6">
				<div className="flex items-center gap-3">
					<Skeleton className="size-10" />
					<div className="flex flex-col gap-1.5">
						<Skeleton className="h-5 w-44" />
						<Skeleton className="h-4 w-56" />
					</div>
				</div>
				<div className="flex flex-col gap-1.5">
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-9 w-full" />
				</div>
				<div className="flex flex-col gap-1.5">
					<Skeleton className="h-4 w-10" />
					<Skeleton className="h-9 w-full" />
					<Skeleton className="h-3 w-32" />
				</div>
				<Skeleton className="h-8 w-full" />
			</div>
		</div>
	);
}
