import { Link } from "@tanstack/react-router";

/**
 * §8 — a non-member sees a 404, never a 403. This screen carries NO hint
 * that an org exists behind the slug; it's the same page for a typo and a
 * real org you're not in.
 */
export function OrgNotFound() {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
			<h1 className="font-semibold text-2xl tracking-tight">not found</h1>
			<p className="text-muted-foreground text-sm">this page doesn't exist.</p>
			<Link
				className="text-sm underline underline-offset-4 transition-colors hover:text-foreground"
				to="/"
			>
				go home
			</Link>
		</div>
	);
}
