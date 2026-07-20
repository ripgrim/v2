import { TripwireLogo } from "#/components/common/tripwire-logo";
import { Skeleton } from "#/components/ui/skeleton";

export function InstallSetupPageSkeleton() {
	return (
		<div className="flex min-h-dvh w-full items-center justify-center bg-background px-6">
			<div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
				<TripwireLogo className="text-foreground" size={28} />
				<Skeleton className="h-5 w-56" />
				<div className="flex w-full flex-col items-center gap-1.5">
					<Skeleton className="h-4 w-72" />
					<Skeleton className="h-4 w-60" />
				</div>
				<Skeleton className="h-8 w-32" />
			</div>
		</div>
	);
}
