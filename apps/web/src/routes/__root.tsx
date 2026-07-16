import { Databuddy } from "@databuddy/sdk/react";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import { DATABUDDY_CLIENT_ID } from "@tripwire/auth/databuddy";
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
	 * §10 — Better Auth gates the dashboard, then onboarding gates it again: a
	 * signed-in user with no active repo goes to /onboarding (same shape as the
	 * auth redirect to /login). When auth env is absent (local dev) both gates
	 * stand open. The run page is unlisted-public (isPublicPath) so blocked
	 * contributors can read the judgment — they can't sign in.
	 */
	beforeLoad: async ({ location }) => {
		if (isPublicPath(location.pathname)) {
			return;
		}
		// OAuth popup routes manage their own auth — the waitlist entry starts
		// sign-in and the callback reads the resulting session — so they must
		// never be gated (a fresh joiner has no session yet).
		if (location.pathname.startsWith("/oauth")) {
			return;
		}
		const session = await getSessionInfo();
		if (session.authEnabled && !session.user) {
			// No session anywhere ⇒ the login screen, in dev exactly as in prod.
			// The §13 auto-login trampoline that used to silently mint
			// DEFAULT_PERSONA on any gated route (and the /dev/auto-login
			// carve-out that fed it) is gone: signed-out means /login, never a
			// surprise persona. Dev personas stay opt-in — the panel on /login
			// and the floating switcher POST /api/dev/login directly.
			throw redirect({ to: "/login" });
		}
		if (!session.user) {
			return;
		}
		// Closed-beta access gate — a gated, not-approved user belongs on /queue.
		// /invite/* stays reachable: redeeming an approved admin's link is HOW a
		// pending user becomes approved (§6). Runs in beforeLoad (before render)
		// so the shell never flashes; gateEnabled is the server's decision,
		// matching what the API boundary enforces.
		if (session.gateEnabled && session.user.accessStatus !== "approved") {
			if (
				location.pathname === "/queue" ||
				location.pathname.startsWith("/invite/")
			) {
				return;
			}
			throw redirect({ to: "/queue" });
		}
		// GitHub's Setup URL redirect carries `?installation_id=…`. However it's
		// configured (some apps land on `/setup`), funnel it into the real
		// callback WITH its params, so the onboarding redirect below can't strip
		// them.
		const search = location.search as {
			installation_id?: string;
			setup_action?: string;
			state?: string;
		};
		if (search.installation_id && location.pathname !== "/onboarding/setup") {
			throw redirect({
				to: "/onboarding/setup",
				search: {
					installation_id: search.installation_id,
					setup_action: search.setup_action,
					state: search.state,
				},
			});
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
			{/* Global product analytics — one mount covers every route (pageviews,
			    interactions, outgoing links, hash changes, web vitals). */}
			<Databuddy
				clientId={DATABUDDY_CLIENT_ID}
				trackHashChanges
				trackAttributes
				trackOutgoingLinks
				trackInteractions
				trackWebVitals
			/>
		</ThemeProvider>
	);
}
