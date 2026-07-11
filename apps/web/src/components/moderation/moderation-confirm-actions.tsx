import {
	Cancel01Icon,
	Delete02Icon,
	SparklesIcon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import type { FlaggedItem, ModerationAction } from "#/lib/moderation.types";
import { useModerationActions } from "#/lib/use-moderation-actions";
import { cn } from "#/lib/utils";

type Spec = {
	action: ModerationAction;
	short: string;
	icon: IconSvgElement;
	/** Fill of the expanded confirm button for this action. */
	confirm: string;
};

const ACTIONS: Spec[] = [
	{
		action: "approve",
		short: "Approve",
		icon: Tick01Icon,
		confirm: "bg-emerald-600 text-white",
	},
	{
		action: "ban",
		short: "Ban",
		icon: SparklesIcon,
		confirm: "bg-red-600 text-white",
	},
	{
		action: "remove",
		short: "Remove",
		icon: Delete02Icon,
		confirm: "bg-primary text-primary-foreground",
	},
];

const SPRING = { type: "spring", stiffness: 420, damping: 38 } as const;

/**
 * An inset segmented select for the decisive action. Tapping an option expands
 * it across the full width into a single confirm button (tinted per action);
 * an X collapses it back.
 */
export function ModerationConfirmActions({ item }: { item: FlaggedItem }) {
	const { act } = useModerationActions();
	const [armed, setArmed] = useState<ModerationAction | null>(null);

	return (
		<LayoutGroup>
			<div
				className="flex items-stretch gap-1 rounded-lg bg-surface-0 p-1"
				data-action
			>
				{ACTIONS.map(({ action, short, icon: Icon, confirm }) => {
					const isArmed = armed === action;
					const dimmed = armed !== null && !isArmed;
					return (
						<motion.button
							key={action}
							type="button"
							layout
							transition={SPRING}
							onClick={() => {
								if (isArmed) {
									act(item, action);
									setArmed(null);
								} else setArmed(action);
							}}
							className={cn(
								"flex h-8 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-md font-medium text-xs",
								isArmed && cn("flex-[6]", confirm),
								dimmed && "pointer-events-none flex-[0_0_0%] p-0 opacity-0",
								!armed &&
									"flex-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
							)}
						>
							{isArmed ? (
								<>
									<HugeiconsIcon
										icon={Tick01Icon}
										size={13}
										strokeWidth={2.5}
									/>
									Confirm {short}
								</>
							) : (
								<>
									<HugeiconsIcon icon={Icon} size={13} strokeWidth={2.25} />
									{short}
								</>
							)}
						</motion.button>
					);
				})}
				<AnimatePresence initial={false}>
					{armed ? (
						<motion.button
							key="x"
							type="button"
							onClick={() => setArmed(null)}
							initial={{ opacity: 0, width: 0 }}
							animate={{ opacity: 1, width: 32 }}
							exit={{ opacity: 0, width: 0 }}
							transition={SPRING}
							aria-label="Cancel"
							className="flex h-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
						>
							<HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
						</motion.button>
					) : null}
				</AnimatePresence>
			</div>
		</LayoutGroup>
	);
}
