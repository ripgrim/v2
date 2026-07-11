import { createServerFn } from "@tanstack/react-start";
import type { RepoContent } from "#/lib/repo-content.types";
import { seedRepoContent } from "#/lib/repo-content-mock-data";

export const getRepoContent = createServerFn({ method: "GET" }).handler(
	async (): Promise<RepoContent> => {
		await new Promise((resolve) => setTimeout(resolve, 200));
		return seedRepoContent();
	},
);
