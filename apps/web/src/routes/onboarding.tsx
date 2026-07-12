import { createFileRoute } from "@tanstack/react-router";
import {
	OnboardingPage,
	OnboardingPageSkeleton,
} from "#/components/onboarding/onboarding-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingPage,
	pendingComponent: OnboardingPageSkeleton,
	head: ({ match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle("Get started"),
			description: "link your github and pick the repo tripwire protects.",
			noindex: true,
		}),
});
