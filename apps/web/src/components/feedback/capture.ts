const MASK_SELECTOR = '[data-privacy="masked"]';
const ACCENT = "#34a6ff";

interface CaptureHighlight {
	rect: DOMRect;
	label: string;
}

/**
 * Viewport screenshot via @renoun/screenshot (lazy — stays out of the entry
 * chunk). The overlay layer and feedback dialog carry `data-screenshot-ignore`
 * so the shot shows the page, not our chrome. Privacy-masked elements are
 * blurred in the live DOM for the duration of the render, then restored.
 * A failure returns null — feedback still submits without the shot.
 */
export async function captureViewport(
	highlight?: CaptureHighlight,
): Promise<Blob | null> {
	const { screenshot } = await import("@renoun/screenshot");
	const cleanups: Array<() => void> = [];
	try {
		for (const el of document.querySelectorAll<HTMLElement>(MASK_SELECTOR)) {
			const previous = el.style.filter;
			el.style.filter = "blur(10px)";
			cleanups.push(() => {
				el.style.filter = previous;
			});
		}
		if (highlight) {
			cleanups.push(appendHighlight(highlight));
		}
		return await screenshot.blob(document.body, {
			x: window.scrollX,
			y: window.scrollY,
			width: window.innerWidth,
			height: window.innerHeight,
			includeFixed: "intersecting",
			format: "png",
		});
	} catch (error) {
		console.error("[feedback] screenshot capture failed:", error);
		return null;
	} finally {
		for (const cleanup of cleanups.reverse()) {
			cleanup();
		}
	}
}

function appendHighlight({ rect, label }: CaptureHighlight): () => void {
	const box = document.createElement("div");
	Object.assign(box.style, {
		position: "fixed",
		top: `${rect.top}px`,
		left: `${rect.left}px`,
		width: `${rect.width}px`,
		height: `${rect.height}px`,
		border: `2px solid ${ACCENT}`,
		backgroundColor: "rgba(52, 166, 255, 0.08)",
		borderRadius: "3px",
		zIndex: "999999",
		pointerEvents: "none",
	});
	const tag = document.createElement("div");
	Object.assign(tag.style, {
		position: "fixed",
		top: `${Math.max(rect.top - 24, 4)}px`,
		left: `${rect.left}px`,
		backgroundColor: ACCENT,
		color: "#ffffff",
		fontSize: "11px",
		fontFamily: "ui-monospace, monospace",
		fontWeight: "500",
		padding: "2px 6px",
		borderRadius: "3px",
		zIndex: "999999",
		pointerEvents: "none",
		whiteSpace: "nowrap",
	});
	tag.textContent = label;
	document.body.append(box, tag);
	return () => {
		box.remove();
		tag.remove();
	};
}
