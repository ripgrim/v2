import {
	ActivityIcon,
	Analytics01Icon,
	CheckListIcon,
	FlowIcon,
	Queue01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

interface MobileFooterProps {
	counts: {
		queue?: number;
	};
}

export function MobileFooter({ counts }: MobileFooterProps) {
	return (
		<nav className="flex min-w-0 items-center gap-3 px-3 pb-4 justify-between">
			<div className="flex shrink-0 items-center justify-center gap-0.5 md:hidden w-full">
				<NavLink to="/" label="Queue" icon={Queue01Icon} value={counts.queue} />
				<NavLink to="/activity" label="Activity" icon={ActivityIcon} />
				<NavLink to="/rules" label="Rules" icon={CheckListIcon} />
				<NavLink to="/workflows" label="Workflows" icon={FlowIcon} />
				<NavLink
					to="/analytics"
					label="Analytics"
					icon={Analytics01Icon}
					exact={false}
				/>
			</div>
		</nav>
	);
}

function NavLink({
	to,
	label,
	value,
	icon,
	exact = true,
}: {
	to: string;
	label: string;
	value?: number;
	icon: IconSvgElement;
	exact?: boolean;
}) {
	return (
		<Link
			to={to}
			activeOptions={{ exact }}
			className="flex h-8 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface-0 hover:text-foreground [&.active]:bg-surface-0 [&.active]:text-foreground"
			activeProps={{ className: "active" }}
		>
			<HugeiconsIcon icon={icon} size={14} strokeWidth={2} />
			<span>{label}</span>
			{typeof value === "number" ? (
				<span className="tabular-nums text-muted-foreground">{value}</span>
			) : null}
		</Link>
	);
}
