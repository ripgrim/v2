import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "#/lib/utils";

/** Page tokens to render: "1".."n" plus "lead"/"trail" ellipses. */
function pageItems(current: number, total: number): string[] {
	if (total <= 6) {
		return Array.from({ length: total }, (_, i) => String(i + 1));
	}
	const items = ["1"];
	if (current > 3) items.push("lead");
	for (
		let n = Math.max(2, current - 1);
		n <= Math.min(total - 1, current + 1);
		n++
	) {
		items.push(String(n));
	}
	if (current < total - 2) items.push("trail");
	items.push(String(total));
	return items;
}

export function RepoPagination({
	page,
	pageCount,
	onPage,
}: {
	page: number;
	pageCount: number;
	onPage: (page: number) => void;
}) {
	const current = page + 1;
	const items = pageItems(current, pageCount);

	return (
		<div className="flex items-center justify-between">
			<button
				type="button"
				disabled={page === 0}
				onClick={() => onPage(page - 1)}
				className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-medium text-[13px] text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
			>
				<HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2} />
				Prev
			</button>

			<div className="flex items-center gap-1">
				{items.map((item) =>
					item === "lead" || item === "trail" ? (
						<span key={item} className="px-1 text-[13px] text-muted-foreground">
							…
						</span>
					) : (
						<button
							key={item}
							type="button"
							onClick={() => onPage(Number(item) - 1)}
							className={cn(
								"inline-flex size-8 items-center justify-center rounded-lg border font-medium text-[13px] text-muted-foreground transition-colors",
								Number(item) === current
									? "border-border bg-surface-0 text-foreground"
									: "border-transparent hover:bg-muted hover:text-foreground",
							)}
						>
							{item}
						</button>
					),
				)}
			</div>

			<button
				type="button"
				disabled={page >= pageCount - 1}
				onClick={() => onPage(page + 1)}
				className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-medium text-[13px] text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
			>
				Next
				<HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
			</button>
		</div>
	);
}
