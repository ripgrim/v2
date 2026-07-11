import { GithubIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ConnectedRepo } from "#/lib/integrations.types";
import { cn } from "#/lib/utils";

export function RepoRow({
	repo,
	active,
	onSelect,
}: {
	repo: ConnectedRepo;
	active: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={active}
			className="group flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors hover:bg-surface-1 focus-visible:bg-surface-1"
		>
			<HugeiconsIcon
				icon={GithubIcon}
				size={16}
				strokeWidth={2}
				className={cn(
					"shrink-0",
					active ? "text-foreground" : "text-muted-foreground",
				)}
			/>

			<div className="flex min-w-0 flex-col">
				<span className="truncate font-medium text-[13px] leading-tight">
					{repo.name}
				</span>
				<span className="truncate text-[11px] text-muted-foreground leading-tight">
					{repo.owner}
					{repo.private ? " · private" : ""}
				</span>
			</div>

			<div className="ml-auto shrink-0 pl-3">
				{active ? (
					<span className="inline-flex items-center gap-1.5 font-medium text-[11px] text-emerald-400">
						<HugeiconsIcon icon={Tick01Icon} size={13} strokeWidth={2} />
						Active
					</span>
				) : (
					<span className="text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
						Set active
					</span>
				)}
			</div>
		</button>
	);
}
