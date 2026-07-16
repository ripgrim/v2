import { createFileRoute, redirect } from "@tanstack/react-router";

/** /:org → /:org/home (§8: canonical org home). */
export const Route = createFileRoute("/$org/")({
	beforeLoad: ({ params }) => {
		throw redirect({ to: "/$org/home", params: { org: params.org } });
	},
});
