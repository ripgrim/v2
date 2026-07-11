import { createServerFn } from "@tanstack/react-start";
import type { LogEntry } from "#/lib/log.types";
import { seedLogEntries } from "#/lib/log-mock-data";

export const getModerationLog = createServerFn({ method: "GET" }).handler(
	async (): Promise<LogEntry[]> => {
		await new Promise((resolve) => setTimeout(resolve, 200));
		return seedLogEntries(Date.now());
	},
);
