import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

export function OrgBillingPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>billing</CardTitle>
				<CardDescription>
					billing lands with autumn — nothing to configure yet.
				</CardDescription>
			</CardHeader>
		</Card>
	);
}

export function OrgBillingPageSkeleton() {
	return <div className="h-24 animate-pulse rounded-xl bg-surface-1" />;
}
