import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import { LayoutGroup } from "motion/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "#/components/ui/sonner";
import { getSessionInfo } from "#/lib/auth.functions";
import { isPublicPath } from "#/lib/run-access";
import { siteConfig } from "#/lib/site-config";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	/**
	 * §10 — Better Auth gates the dashboard. When auth env is absent (local
	 * dev before the OAuth app exists) the gate stands open; see
	 * VERIFICATION-QUEUE. The run page is unlisted-public (isPublicPath) so
	 * blocked contributors can read the judgment — they can't sign in.
	 */
	beforeLoad: async ({ location }) => {
		if (isPublicPath(location.pathname)) {
			return;
		}
		const session = await getSessionInfo();
		if (session.authEnabled && !session.user) {
			throw redirect({ to: "/login" });
		}
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "application-name", content: siteConfig.name },
			{ name: "theme-color", content: siteConfig.themeColor },
			{ name: "format-detection", content: "telephone=no" },
			{ title: siteConfig.defaultTitle },
			{ name: "description", content: siteConfig.defaultDescription },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-background font-sans antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent() {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<LayoutGroup>
				<Outlet />
			</LayoutGroup>
			<Toaster />
		</ThemeProvider>
	);
}
