import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
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
				<Button
					className="w-full"
					iconLeft={
						<HugeiconsIcon icon={GithubIcon} size={16} strokeWidth={2} />
					}
					onClick={async () => {
						const { error } = await authClient.signIn.social({
							provider: "github",
							callbackURL: "/",
						});
						if (error) {
							toast(
								error.message ??
									"sign-in failed — is the github oauth app configured?",
							);
						}
					}}
				>
					continue with github
				</Button>
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
