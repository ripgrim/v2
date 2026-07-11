import { createFileRoute } from "@tanstack/react-router";
import { LoginPage, LoginPageSkeleton } from "#/components/auth/login-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/login")({
	component: LoginPage,
	pendingComponent: LoginPageSkeleton,
	head: ({ match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle("Sign in"),
			description: "maintainer sign-in via github.",
			noindex: true,
		}),
});
