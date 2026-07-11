import { motion } from "motion/react";
import { memo, useState } from "react";
import { RuleDetail } from "#/components/automod/rule-detail";
import { Sparkline } from "#/components/charts/dither-kit";
import { useSidePanel } from "#/components/layouts/dashboard-side-panel";
import { Switch } from "#/components/ui/switch";
import type { AutomodRule } from "#/lib/automod.types";
import { getActionLabel, getCategoryConfig } from "#/lib/automod-category";
import { useAutomodActions } from "#/lib/use-automod-actions";
import { cn } from "#/lib/utils";

export const RuleRow = memo(function RuleRow({ rule }: { rule: AutomodRule }) {
	const { activeKey, open, close } = useSidePanel();
	const { toggleRule } = useAutomodActions();
	const { icon: CategoryIcon } = getCategoryConfig(rule.category);
	const isActive = activeKey === rule.id;
	const scope = rule.scope.length === 3 ? "all content" : rule.scope.join(", ");
	const [hovered, setHovered] = useState(false);

	return (
		<motion.div
			layout
			transition={{ type: "spring", stiffness: 600, damping: 44 }}
			onPointerEnter={() => setHovered(true)}
			onPointerLeave={() => setHovered(false)}
			className={cn("group relative rounded-lg", isActive && "bg-muted")}
		>
			<button
				type="button"
				aria-pressed={isActive}
				aria-label={isActive ? `Close ${rule.name}` : `Open ${rule.name}`}
				onClick={() =>
					isActive ? close() : open(rule.id, <RuleDetail ruleId={rule.id} />)
				}
				className="absolute inset-0 z-0 rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 group-hover:bg-muted"
			/>

			<div
				className={cn(
					"pointer-events-none relative z-10 flex items-center gap-3 px-3 py-2.5",
					!rule.enabled && "opacity-50",
				)}
			>
				<CategoryIcon
					size={15}
					strokeWidth={2}
					className="shrink-0 text-muted-foreground"
				/>

				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<div className="flex items-center gap-2">
						<p className="truncate text-sm font-medium">{rule.name}</p>
						{/* <CategoryPill category={rule.category} className="shrink-0" /> */}
					</div>
					<p className="truncate text-xs text-muted-foreground">
						{getActionLabel(rule.action)} · {scope}
					</p>
				</div>

				<div className="hidden shrink-0 items-center gap-5 md:flex">
					<div className="h-7 w-20">
						<Sparkline
							data={rule.trend}
							color="blue"
							hovered={hovered}
							bloom="aura"
						/>
					</div>
					<div className="w-12 text-right">
						<p className="text-sm font-medium tabular-nums leading-none">
							{rule.matches24h}
						</p>
						<p className="mt-1 text-[11px] text-muted-foreground">24h</p>
					</div>
					<div className="pointer-events-auto" data-action>
						<Switch
							checked={rule.enabled}
							onCheckedChange={() => toggleRule(rule)}
							aria-label={`${rule.enabled ? "Disable" : "Enable"} ${rule.name}`}
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
});
