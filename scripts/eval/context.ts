import type { AiReviewGenerate, RuleContext } from "@tripwire/core";
import { createGenerate } from "../../apps/worker/src/ai/generate.ts";
import type { EvalFixture } from "./fixtures.ts";

const NOW = "2026-07-17T00:00:00.000Z";

/** A change-request event for a fixture, shaped like the worker's normalized event. */
function fixtureEvent(fixture: EvalFixture) {
	return {
		kind: "change-request.opened" as const,
		id: `eval-${fixture.name}`,
		forge: "github" as const,
		deliveryId: `eval-${fixture.name}`,
		repo: { fullName: "eval/sandbox", private: false },
		actor: { login: "eval-contributor" },
		changeRequest: {
			number: 1,
			title: fixture.title,
			headSha: "evalsha",
			baseRef: "main",
			headRef: "eval",
			draft: false,
			url: "https://example.com/pr/1",
		},
		occurredAt: NOW,
		receivedAt: NOW,
	};
}

/** Reads backed by the fixture — the tools resolve against authored data, no network. */
function fixtureReads(fixture: EvalFixture) {
	return {
		getDiff: () => Promise.resolve(fixture.diff),
		getCommits: () => Promise.resolve(fixture.commits ?? []),
		getContributorProfile: () =>
			Promise.resolve({
				login: "eval-contributor",
				createdAt: "2021-01-01T00:00:00.000Z",
				followers: 2,
				publicRepos: 4,
				profileText: "eval",
				mergedInRepo: 1,
				mergedElsewhere: 3,
				recentChangeRequestTimes: [],
				isOrgMember: false,
				isMaintainer: false,
			}),
	} as unknown as Parameters<typeof createGenerate>[0]["reads"];
}

/** Build the real ai-review generate effect for a fixture, using the live model. */
export function buildGenerate(
	fixture: EvalFixture,
	apiKey: string,
	model: string,
): AiReviewGenerate {
	return createGenerate({
		apiKey,
		defaultModel: model,
		reads: fixtureReads(fixture),
		readFile: (_repo, path) =>
			Promise.resolve(fixture.fileContents?.[path] ?? "(file not found)"),
		event: fixtureEvent(fixture) as never,
	});
}

/** The RuleContext the ai-review rule evaluates against. */
export function buildContext(
	fixture: EvalFixture,
	generate: AiReviewGenerate,
): RuleContext {
	return {
		event: fixtureEvent(fixture),
		now: NOW,
		diff: fixture.diff,
		commits: null,
		contributor: {
			login: "eval-contributor",
			createdAt: "2021-01-01T00:00:00.000Z",
			followers: 2,
			publicRepos: 4,
			profileText: "eval",
			mergedInRepo: 1,
			mergedElsewhere: 3,
			recentChangeRequestTimes: [],
			isOrgMember: false,
			isMaintainer: false,
		},
		generate,
	} as unknown as RuleContext;
}
