import { useQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { OrgAvatar } from "#/components/organizations/org-avatar";
import { orgContextQueryOptions } from "#/lib/org.query";

const route = getRouteApi("/$org/settings");

const NAV_ITEMS = [
	{ label: "members", to: "/$org/settings/members" },
	{ label: "settings", to: "/$org/settings/settings" },
	{ label: "billing", to: "/$org/settings/billing" },
] as const;

/**
 * Settings shell for /:org/settings/* — org identity header, the small
 * members/settings/billing nav, and the children pane. Role-gated controls
 * live in the pages themselves (the server is the real boundary).
 */
export function OrgSettingsLayout({ children }: { children: ReactNode }) {
	const { org } = route.useParams();
	const { data: orgContext } = useQuery(orgContextQueryOptions(org));

	return (
		<DashboardLayout counts={{}}>
			<div className="mx-auto w-full max-w-4xl px-6 py-8">
				<header className="mb-6 flex items-center gap-3">
					<OrgAvatar
						hue={orgContext?.avatarHue}
						name={orgContext?.name ?? org}
						size={32}
					/>
					<div>
						<h1 className="font-semibold text-2xl tracking-tight">
							{orgContext?.name ?? org}
						</h1>
						<p className="text-muted-foreground text-sm">org settings</p>
					</div>
				</header>

				<nav className="mb-6 flex items-center gap-1 border-b">
					{NAV_ITEMS.map((item) => (
						<Link
							activeProps={{
								className: "border-foreground text-foreground",
							}}
							className="-mb-px border-transparent border-b-2 px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
							key={item.to}
							params={{ org }}
							to={item.to}
						>
							{item.label}
						</Link>
					))}
				</nav>

				<div>{children}</div>
			</div>
		</DashboardLayout>
	);
}
