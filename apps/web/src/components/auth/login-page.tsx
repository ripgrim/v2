import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { authClient } from "#/lib/auth-client";
import { siteConfig } from "#/lib/site-config";

export function LoginPage() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-background">
			<div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border bg-card px-8 py-10">
				<div className="text-center">
					<div className="font-pixel text-lg tracking-tight">
						{siteConfig.name}
					</div>
					<p className="mt-1 text-muted-foreground text-sm">
						{siteConfig.tagline}
					</p>
				</div>
				<button
					className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
					onClick={() =>
						authClient.signIn.social({ provider: "github", callbackURL: "/" })
					}
					type="button"
				>
					<HugeiconsIcon icon={GithubIcon} size={16} strokeWidth={2} />
					continue with github
				</button>
				<p className="text-center text-muted-foreground text-xs">
					maintainers only — contributors never need an account.
				</p>
			</div>
		</div>
	);
}

export function LoginPageSkeleton() {
	return (
		<div className="flex min-h-dvh items-center justify-center">
			<div className="h-64 w-full max-w-sm animate-pulse rounded-xl bg-surface-1" />
		</div>
	);
}
