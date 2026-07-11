import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import type { GithubAccount } from "#/lib/integrations.types";

export function GithubAccountCard({ account }: { account: GithubAccount }) {
	const typeLabel =
		account.type === "Organization" ? "Organization" : "Personal account";

	return (
		<div className="flex items-center justify-between gap-4 rounded-xl p-2">
			<div className="flex min-w-0 items-center gap-3">
				<img
					src={account.avatarUrl}
					alt={account.login}
					className="size-9 shrink-0 rounded-lg border border-border bg-surface-2"
				/>
				<div className="flex min-w-0 flex-col">
					<span className="truncate font-medium text-sm">{account.login}</span>
					<span className="truncate text-muted-foreground text-xs">
						{typeLabel}
					</span>
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-1.5">
				<Button
					variant="ghost"
					size="xs"
					className="text-muted-foreground hover:text-foreground"
					onClick={() => toast(`Manage ${account.login}`)}
				>
					Manage
				</Button>
				<Button
					variant="ghost"
					size="xs"
					className="bg-surface-1 text-foreground hover:bg-surface-2"
					onClick={() => toast(`Uninstalled ${account.login}`)}
				>
					Uninstall
				</Button>
			</div>
		</div>
	);
}
