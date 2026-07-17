/**
 * Interrupt cleanup registry. A running scenario registers its teardown here so
 * a Ctrl-C closes the PR it opened and restores the pinned config, instead of
 * leaking an open PR on the sacrificial repo. The scenario clears it on a normal
 * exit. Kept tiny and module-global on purpose: only one scenario runs at a time.
 */
let activeCleanup: (() => Promise<void>) | null = null;

export function setActiveCleanup(fn: (() => Promise<void>) | null): void {
	activeCleanup = fn;
}

/** Run the active scenario's teardown, if one is registered. */
export async function runActiveCleanup(): Promise<void> {
	if (activeCleanup) {
		await activeCleanup();
	}
}
