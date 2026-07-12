import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The moderation queue is the home page now (§4 collapse — one queue surface).
 * `/moderation` redirects so old links keep working.
 */
export const Route = createFileRoute("/moderation")({
	beforeLoad: () => {
		throw redirect({ to: "/" });
	},
});
