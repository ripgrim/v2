import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { AccessPendingScreen } from "#/components/auth/access-pending-screen";
import { Spinner } from "#/components/ui/spinner";
import { getSessionInfo } from "#/lib/auth.functions";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/queue")({
	component: QueuePage,
	head: ({ match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle("Access queue"),
			description: "Your Tripwire access request status.",
			noindex: true,
		}),
});

function QueuePage() {
	const router = useRouter();
	const { data, isLoading } = useQuery({
		queryKey: ["session-info"],
		queryFn: () => getSessionInfo(),
		staleTime: 15_000,
	});

	useEffect(() => {
		if (!data) return;
		if (!data.user) {
			router.navigate({ to: "/login" });
			return;
		}
		// Approved users have no business on the queue — send them onward.
		if (data.user.accessStatus === "approved") {
			router.navigate({ to: "/" });
		}
	}, [data, router]);

	if (isLoading || !data?.user) {
		return (
			<div className="flex min-h-dvh w-full items-center justify-center bg-background">
				<Spinner className="text-muted-foreground" size={20} />
			</div>
		);
	}

	return (
		<AccessPendingScreen
			email={data.user.email}
			image={data.user.image}
			status={data.user.accessStatus}
		/>
	);
}
