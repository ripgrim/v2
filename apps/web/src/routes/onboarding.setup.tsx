import { createFileRoute, redirect } from "@tanstack/react-router";
import { completeInstallation } from "#/lib/onboarding.functions";

/**
 * The GitHub App **Setup URL** callback (§10). GitHub redirects here after an
 * install with `?installation_id=…&setup_action=install&state=…`. We link the
 * installation to the signed-in user (the state HMAC-binds them, CSRF) and send
 * them to /onboarding to pick their active repo. This path is under /onboarding
 * so the onboarding gate lets a not-yet-onboarded user through.
 */
export const Route = createFileRoute("/onboarding/setup")({
	validateSearch: (search: Record<string, unknown>) => ({
		installation_id:
			typeof search.installation_id === "string"
				? search.installation_id
				: undefined,
		setup_action:
			typeof search.setup_action === "string" ? search.setup_action : undefined,
		state: typeof search.state === "string" ? search.state : undefined,
	}),
	beforeLoad: async ({ search }) => {
		if (search.installation_id) {
			await completeInstallation({
				data: {
					installationId: search.installation_id,
					state: search.state,
				},
			});
		}
		throw redirect({ to: "/onboarding" });
	},
	component: () => null,
});
