import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Shared class for clickable crumb segments. */
export const CRUMB_LINK =
	"text-[13px] text-muted-foreground transition-colors hover:text-foreground";

export function CrumbSep() {
	return <span className="text-[13px] text-muted-foreground/50">/</span>;
}

/** The current (non-link) trailing crumb. */
export function CrumbText({ children }: { children: ReactNode }) {
	return (
		<span className="font-medium text-[13px] text-foreground">{children}</span>
	);
}

/**
 * Breadcrumb prefix that mirrors the URL — `github / org / repo / …`. The org
 * links to its repos list and the repo to its analytics overview; pages supply
 * the trailing section/number crumbs as `children`.
 */
export function RepoCrumbs({
	org,
	repo,
	children,
}: {
	org: string;
	repo?: string;
	children?: ReactNode;
}) {
	return (
		<div className="flex min-w-0 items-center gap-2">
			<HugeiconsIcon
				icon={GithubIcon}
				size={14}
				strokeWidth={1.7}
				className="shrink-0 text-muted-foreground"
			/>
			<Link to="/$org/repos" params={{ org }} className={CRUMB_LINK}>
				{org}
			</Link>
			{repo ? (
				<>
					<CrumbSep />
					<Link
						to="/$org/$repo/analytics"
						params={{ org, repo }}
						className={CRUMB_LINK}
					>
						{repo}
					</Link>
				</>
			) : null}
			{children}
		</div>
	);
}
