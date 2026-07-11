import type { ContributorProfile } from "#/lib/contributor.types";
import { seedContributorProfile } from "#/lib/contributor-mock-data";

// Mock-backed. In a real deployment this would hit the GitHub API + the
// moderation store behind auth — the call site doesn't care which.
export async function getContributorProfile(
	handle: string,
): Promise<ContributorProfile> {
	// Small latency so the loading skeleton is observable in dev.
	await new Promise((resolve) => setTimeout(resolve, 200));
	return seedContributorProfile(handle, Date.now());
}
