import { AnimatePresence, motion } from "motion/react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useState,
} from "react";
import { cn } from "#/lib/utils";

const INSET_DIALOG_SPRING = {
	type: "spring",
	stiffness: 360,
	damping: 38,
} as const;

interface InsetDialogContextValue {
	openCount: number;
	setOpen: (id: string, open: boolean) => void;
}

const InsetDialogContext = createContext<InsetDialogContextValue | null>(null);

/**
 * Tracks whether any inset dialog is presented so the page shell can recede
 * behind it (scale down + drop — the sheet takes importance). Mount once around
 * the shell; the shell reads [[useInsetDialogPresence]].
 */
export function InsetDialogProvider({ children }: { children: ReactNode }) {
	const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());
	const setOpen = useCallback((id: string, open: boolean) => {
		setOpenIds((prev) => {
			if (prev.has(id) === open) {
				return prev;
			}
			const next = new Set(prev);
			if (open) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	}, []);
	const value = useMemo(
		() => ({ openCount: openIds.size, setOpen }),
		[openIds, setOpen],
	);
	return (
		<InsetDialogContext.Provider value={value}>
			{children}
		</InsetDialogContext.Provider>
	);
}

/** True while any inset dialog is open — drive the shell's recede off this. */
export function useInsetDialogPresence(): boolean {
	return (useContext(InsetDialogContext)?.openCount ?? 0) > 0;
}

interface InsetDialogProps {
	open: boolean;
	onClose: () => void;
	children: ReactNode;
	/** Sizing overrides — width/height caps land here (default max-w-xl). */
	className?: string;
}

/**
 * Inset dialog — a bottom-attached sheet with a fixed width (not full-bleed).
 * It springs up from the bottom edge; the backdrop dims the page, which recedes
 * via [[InsetDialogProvider]]. Esc, backdrop click, or the caller's own close
 * affordance dismiss it. The bottom edge stays glued to the viewport bottom, so
 * only the top corners are rounded.
 */
export function InsetDialog({
	open,
	onClose,
	children,
	className,
}: InsetDialogProps) {
	const id = useId();
	const ctx = useContext(InsetDialogContext);
	const setOpen = ctx?.setOpen;

	useEffect(() => {
		setOpen?.(id, open);
		return () => setOpen?.(id, false);
	}, [id, open, setOpen]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	return (
		<AnimatePresence>
			{open ? (
				<div className="fixed inset-0 z-50">
					<motion.button
						animate={{ opacity: 1 }}
						aria-label="Close"
						className="absolute inset-0 bg-background/60"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						onClick={onClose}
						transition={{ duration: 0.2 }}
						type="button"
					/>
					<div className="pointer-events-none absolute inset-0 flex items-end justify-center px-3 md:px-0">
						<motion.div
							animate={{ y: 0 }}
							aria-modal="true"
							className={cn(
								"pointer-events-auto flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl border border-b-0 bg-popover shadow-lg",
								className,
							)}
							exit={{ y: "110%" }}
							initial={{ y: "110%" }}
							role="dialog"
							transition={INSET_DIALOG_SPRING}
						>
							{children}
						</motion.div>
					</div>
				</div>
			) : null}
		</AnimatePresence>
	);
}
