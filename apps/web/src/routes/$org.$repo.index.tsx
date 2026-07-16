import { createFileRoute, redirect } from "@tanstack/react-router";

/** /:org/:repo → moderation (the repo's daily surface). */
export const Route = createFileRoute("/$org/$repo/")({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: "/$org/$repo/moderation",
			params: { org: params.org, repo: params.repo },
		});
	},
});
