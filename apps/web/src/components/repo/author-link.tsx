import { Link } from "@tanstack/react-router";
import { cn } from "#/lib/utils";

/**
 * A login that links to the author's profile (`/profile/$userHandle`) — used
 * everywhere an author is shown so any handle traces to their profile.
 * Renders `@login`; pass `at={false}` where the `@` would be redundant.
 *
 * `org`/`repo` are accepted for call-site convenience but no longer routed on,
 * since profiles live at the root now.
 */
export function AuthorLink({
	login,
	at = false,
	className,
}: {
	org?: string;
	repo?: string;
	login: string;
	at?: boolean;
	className?: string;
}) {
	return (
		<Link
			to="/profile/$userHandle"
			params={{ userHandle: login }}
			className={cn("transition-colors hover:text-brand", className)}
		>
			{at ? "@" : ""}
			{login}
		</Link>
	);
}
