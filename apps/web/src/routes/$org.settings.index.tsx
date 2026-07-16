import { createFileRoute, redirect } from "@tanstack/react-router";

/** /:org/settings → members (the page you usually came for). */
export const Route = createFileRoute("/$org/settings/")({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: "/$org/settings/members",
			params: { org: params.org },
		});
	},
});
