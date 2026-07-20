import { TripwireLogo } from "#/components/common/tripwire-logo";
import { Skeleton } from "#/components/ui/skeleton";

export function LoginPageSkeleton() {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
			<div className="flex w-full max-w-xs flex-col items-center text-center">
				<TripwireLogo className="text-foreground" size={36} />
				<Skeleton className="mt-5 h-4 w-48" />
				<Skeleton className="mt-8 h-9 w-full" />
			</div>
		</div>
	);
}
