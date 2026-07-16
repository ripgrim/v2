# Org migration — checkpoint 2 worksheet + runbook

## CP2 enumeration — every site deriving context from `active_repo_id`

Enumerate first, then transform (process requirement). Checked = converted to
URL-derived `(org, repo)` context or retired. The failure mode is the ONE call
site that quietly still reads the DB field — this list is how that becomes
impossible. At the end, `active_repo_id` is dead and grep proves it (the
boundary test carries a no-references check).

### Server functions (apps/web/src/lib)
- [x] activity.functions.ts `getActivityFeed` — getActiveRepo → (org, repo) params
- [x] moderation.functions.ts `getModerationStats` — getActiveRepo → params
- [x] moderation-queue.functions.ts `listModerationQueue` — getActiveRepo → params
- [x] moderation-queue.functions.ts `decideModeration` — org-admin gated, repo from params
- [x] arm.functions.ts `armActiveRepo` → retire (replaced by `armRepo(org, repo)`)
- [x] arm.functions.ts `disarmActiveRepo` → retire (replaced by `disarmRepo(org, repo)`)
- [x] arm.functions.ts `armRepoById` — org-admin gated, repo must belong to org
- [x] runs.functions.ts `getLatestRunId` — getActiveRepo → params
- [x] rules.functions.ts `listRuleConfigViews` / `getRulesHeaderStats` / `saveRuleConfig` — repo from params, org-checked
- [x] workflows.functions.ts `getWorkflowForRepo` / `saveWorkflowForRepo` — repo must belong to org
- [x] analytics-activity.functions.ts `getAnalyticsActivity` — org/repo params
- [x] onboarding.functions.ts `getActiveRepoInfo` → retire (URL owns scope)
- [x] onboarding.functions.ts `chooseActiveRepo` → retire
- [x] onboarding.functions.ts `getSwitcherRepos` → org-scoped `listOrgRepos`
- [x] onboarding.functions.ts `getOnboardingState` → org-scoped install state
- [x] onboarding.functions.ts `getInstallUrl` — org-bound signed state
- [x] onboarding.functions.ts `completeInstallation` — verifies org state, claim/confirm
- [x] auth.functions.ts `getSessionInfo` — `onboarded` derived from orgs, not activeRepo
- [x] server/active-repo.ts — retire; replaced by org+repo resolution
- [x] server/dev/handler.ts — personas seed orgs, not activeRepoId

### Pages/components
- [x] home-page.tsx (→ $org/home)
- [x] activity-page.tsx, moderation-page.tsx, rules-page.tsx, workflows-page.tsx, analytics (→ $org/$repo/…)
- [x] repo-switcher.tsx (→ org + repo switcher, new-org creation)
- [x] backfill-progress.tsx (repo from props/params)
- [x] onboarding-page.tsx (→ org home install CTA + claim/confirm screens)

### Non-URL entrypoints (context WITHOUT a URL — by design)
- worker process-event: installation_id → organization_installations → org → repos ✅ (CP1)
- worker backfill/arm jobs: repoId on the job payload ✅ (unchanged)
- SSE /events/stream: session → membership rows → visible repos (CP2)
- dev/demo seeds: seed orgs directly (CP2)
- MCP tools: none exist (verified)

## Migration runbook (§11)

Rehearse against a copy of prod first; every step is idempotent.

1. **Deploy the new build** (api, worker, web) — new code reads org tables that
   don't exist yet? No: DDL ships with the app (`applyMigrations` on boot for
   the worker path) but run it explicitly first to be deliberate:
2. `DATABASE_URL=<prod> bun run scripts/migrate-orgs.ts`
   — applies drizzle migrations 0006 (org tables) + 0007 (drop
   `user.active_repo_id`), then the data backfill: personal org per user →
   `user_installations` re-parent → `repos.org_id` fill → END-STATE
   verification (exits non-zero if any claimed installation left a repo with
   NULL org_id). Re-run at will; a second run is a no-op.
3. **Verify**: the printed report shows `claimedButNullRepos: 0`;
   `unclaimedRepos` counts GitHub-side installs nobody claimed (legitimately
   invisible until claimed).
4. **Move the founding installation** personal→team org: create the team org
   in the UI (switcher → new org), then from the source org run the
   move-installation server op (`moveInstallationToOrg` — requires admin on
   BOTH orgs). History follows automatically (events/runs key on
   repoFullName).
5. **Later cleanup migration** (separate PR, after prod soak):
   `DROP TABLE user_installations`.

New env: none. (`GITHUB_APP_SLUG`, `BETTER_AUTH_SECRET` unchanged; install
state now signs {userId, orgId} with the same secret.)

## Manual test matrix

| # | Scenario | Expect |
|---|---|---|
| 1 | Fresh signup (GitHub OAuth) | personal org auto-created (slug from name), lands on /:org/home via `/` redirect |
| 2 | Invite redeem — NEW user, approved inviter | signup → /invite/:token → join → membership with carried role + accessStatus approved → org home (no /queue) |
| 3 | Invite redeem — new user, PENDING inviter | membership created, user still pending → /queue |
| 4 | Invite redeem — EXISTING member | no-op: role unchanged, `uses` unchanged, lands in org |
| 5 | Invite expiry / revoke / max-use | honest per-reason refusals on the invite page |
| 6 | Last-admin guard | sole admin cannot demote/remove self or leave; promote a second admin first, then leave works |
| 7 | No self-kick | remove button disabled on self; server refuses with "leave instead" |
| 8 | Wrong-org URL (non-member) | 404 — indistinguishable from a nonexistent org |
| 9 | Install WITH state | GitHub → /onboarding/setup → confirmation names both sides → confirm → repos appear in the org |
| 10 | Install WITHOUT state (GitHub-side) | claim screen with admin-only org picker; nothing auto-attached |
| 11 | Personal-org restrictions | no invite section, no delete, no member add; leave refused |
| 12 | Org deletion | admins only; cascade enumerated; typed-name required; repos soft-removed; history retained |
| 13 | Avatar regen | new-org creator and org settings: avatar regenerates live as the name is typed |
| 14 | Org switcher | orgs listed personal-first, new-org creation inline, repos section inside an org |
| 15 | SSE visibility | member of org A receives no org-B run/event notifications |

