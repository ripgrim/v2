#!/usr/bin/env bun
import { $ } from "bun";

/**
 * Trigger a fresh Tripwire run end-to-end by pushing an empty commit to a
 * scratch pull request — the webhook fires, the worker evaluates, and a run
 * lands with its §10 evidence projection. Old runs predate the projection, so
 * a FRESH commit is the only way to see current behavior.
 *
 * Config is env-routed so any contributor can point it at their own sacrificial
 * repo without editing code:
 *   TEST_REPO     owner/name of the repo         (default Boring-Software-Inc/scratch)
 *   TEST_BRANCH   the open PR's head branch       (default fix-typo)
 *   TEST_WORKDIR  where to clone/reuse the repo   (default $TMPDIR/tripwire-test-run)
 *   TEST_MESSAGE  the empty-commit message         (default "test: trigger tripwire run")
 * Requires: gh CLI authenticated with push access to TEST_REPO.
 */

const REPO = process.env.TEST_REPO ?? "Boring-Software-Inc/scratch";
const BRANCH = process.env.TEST_BRANCH ?? "fix-typo";
const WORKDIR =
	process.env.TEST_WORKDIR ??
	`${process.env.TMPDIR?.replace(/\/$/, "") ?? "/tmp"}/tripwire-test-run`;
const MESSAGE = process.env.TEST_MESSAGE ?? "test: trigger tripwire run";

$.throws(true);

const exists = await $`test -d ${WORKDIR}/.git`.nothrow().quiet();
if (exists.exitCode !== 0) {
	console.log(`cloning ${REPO} → ${WORKDIR}`);
	await $`gh repo clone ${REPO} ${WORKDIR}`.quiet();
}

await $`git fetch origin ${BRANCH}`.cwd(WORKDIR).quiet();
await $`git checkout ${BRANCH}`.cwd(WORKDIR).quiet();
await $`git reset --hard origin/${BRANCH}`.cwd(WORKDIR).quiet();
await $`git commit --allow-empty -m ${MESSAGE}`.cwd(WORKDIR).quiet();
await $`git push origin ${BRANCH}`.cwd(WORKDIR).quiet();

const sha = (await $`git rev-parse HEAD`.cwd(WORKDIR).text()).trim();
const prUrl = (
	await $`gh pr view ${BRANCH} --repo ${REPO} --json url --jq .url`
		.nothrow()
		.text()
).trim();

console.log(`\npushed ${sha.slice(0, 7)} to ${REPO}#${BRANCH}`);
console.log(prUrl ? `PR: ${prUrl}` : "(no open PR found for this branch)");
console.log("the worker should produce a run shortly — check /runs or the DB.");
