import { createServerFn } from "@tanstack/react-start";
import type { GithubIntegration } from "#/lib/integrations.types";
import { seedGithubIntegration } from "#/lib/integrations-mock-data";

export const getGithubIntegration = createServerFn({ method: "GET" }).handler(
	async (): Promise<GithubIntegration> => {
		await new Promise((resolve) => setTimeout(resolve, 200));
		return seedGithubIntegration(Date.now());
	},
);
