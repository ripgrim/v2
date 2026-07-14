import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "#/components/home/home-page";
import { switcherReposQueryOptions } from "#/lib/onboarding.query";

export const Route = createFileRoute("/")({
	ssr: false,
	loader: ({ context }) => {
		void context.queryClient.prefetchQuery(switcherReposQueryOptions());
	},
	component: HomePage,
});
