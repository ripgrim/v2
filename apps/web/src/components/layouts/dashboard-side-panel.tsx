import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

// w-80 (320px) + pl-2 (8px)
export const SIDE_PANEL_WIDTH = 328;

type SidePanelState = {
	content: ReactNode | null;
	/** Identifies the open subject so rows can render an active state. */
	activeKey: string | null;
	collapsed: boolean;
	open: (key: string, content: ReactNode) => void;
	close: () => void;
	toggle: () => void;
};

const SidePanelContext = createContext<SidePanelState | null>(null);

export function useSidePanel() {
	const ctx = useContext(SidePanelContext);
	if (!ctx) {
		throw new Error("useSidePanel must be used within a SidePanelProvider");
	}
	return ctx;
}

export function SidePanelProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<{
		key: string | null;
		content: ReactNode | null;
	}>({ key: null, content: null });
	const [collapsed, setCollapsed] = useState(false);

	const open = useCallback((key: string, content: ReactNode) => {
		setState({ key, content });
		setCollapsed(false);
	}, []);
	const close = useCallback(() => setState({ key: null, content: null }), []);
	const toggle = useCallback(() => setCollapsed((c) => !c), []);

	return (
		<SidePanelContext
			value={{
				content: state.content,
				activeKey: state.key,
				collapsed,
				open,
				close,
				toggle,
			}}
		>
			{children}
		</SidePanelContext>
	);
}

export function SidePanelToggle() {
	const { content, collapsed, toggle } = useSidePanel();
	if (!content) return null;

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={collapsed ? "Show details" : "Hide details"}
			className="absolute right-0 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 bg-surface-1 py-2.5 pl-0.5 pr-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground md:flex"
		>
			<HugeiconsIcon
				icon={ArrowRight01Icon}
				size={12}
				strokeWidth={2}
				className={collapsed ? "rotate-180" : ""}
			/>
		</button>
	);
}
