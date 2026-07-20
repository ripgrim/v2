import { createFileRoute, redirect } from "@tanstack/react-router";

/** Settings is a dialog now — the tab lives in `?settings=`, not a page. */
export const Route = createFileRoute("/$org/settings/settings")({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: "/$org/home",
			params: { org: params.org },
			search: { settings: "settings" },
		});
	},
});
