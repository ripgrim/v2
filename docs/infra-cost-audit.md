# Tripwire — Infrastructure Cost Audit & Scaling Economics

_Pre-launch model for v2. Retrieval date for all external pricing: **2026-07-16**. Prices change; every external figure is cited with the page it came from and should be re-verified before a budget is locked._

---

## 1. Executive summary (2-minute read)

Tripwire v2 runs as **three Railway services** (web SSR, api, worker) against **PlanetScale Postgres**, with the **marketing landing on Vercel** and **Databuddy** for analytics/flags. Postgres is *external* (PlanetScale), not a Railway volume — so the feared "Railway 5 GB storage cliff" essentially **does not apply** to us; our storage growth lives on PlanetScale's meter, which is years away from mattering at current event rates.

**Cash you are committed to today (out of pocket, monthly):** ~**$20/mo** — Railway (~$12, 3 small containers on the Hobby base + usage) + PlanetScale (~$8, one small PS-5 node). Vercel is **$0 today because the Pro plan is comped**; Databuddy is **$0 on the free tier**; OpenRouter AI review is **$0 because it's gated off** (`OPENROUTER_API_KEY` unset ⇒ the worker skips it).

**The committed floor rises to ~$45–65/mo** once two near-certain things land:
1. the **Vercel Pro comp lapses** (~3 months out) → **+$20/mo**, and
2. the **Railway seat/plan jump** (cofounder write access + spend caps ⇒ Hobby→Pro at $20/seat) → **+$15–35/mo** over today.

**The first three cliffs, by proximity:**
1. **Vercel comp lapse (~3 mo, date-certain):** +$20/mo, unavoidable.
2. **Railway Hobby→Pro seat jump (team-triggered, weeks-to-months):** +$15–35/mo.
3. **Delaware franchise tax + annual report (date-certain, next due 2027-03-01):** ~**$450 lump** + registered agent ~$100 — small monthly but a real lump ≈ a year of infra.

**The one number that decides everything past launch: is AI review turned on, and on every repo?** At **Fable 5 ($10 in / $50 out per 1M tokens — 2× Opus)**, AI-on-every-PR is the dominant cost driver by a factor of 5–20×. With AI **off**, even a hype-scale launch is **~$140–200/mo**. With AI **on for all PRs**, expected-scale six months out is **~$900/mo** and hype-scale is **several thousand/mo**. Everything else on the bill is rounding error next to this lever. Gate it, cap it, cache it, and/or default it to a cheaper model tier.

---

## 2. Cost inventory

Each line classified **Committed** (pay regardless), **Contingent** (scales with usage / crosses a threshold), or **Optional** (toggleable; off or removable).

| # | Cost surface | Vendor / plan | Class | Today | Evidence in repo |
|---|---|---|---|---|---|
| 1 | App hosting — web (SSR), api, worker | Railway, Hobby ($5 base + $5 usage credit) | **Committed** | ~$12/mo | `apps/{web,api,worker}/railway.json` + `Dockerfile`; `DEPLOY.md` §1 "three services on Railway … Railway **Hobby** plan" |
| 2 | Primary database | PlanetScale Postgres, PS-5 single-node ($5, 10 GB incl.) | **Committed** | ~$5–8/mo | `.env.example` "In prod this is PlanetScale's POOLED URL"; `DATABASE_URL_DIRECT` for SSE LISTEN / worker NOTIFY; `bun run verify:planetscale`; `DEPLOY.md` "Postgres on PlanetScale" |
| 3 | Job queue | pg-boss (rides on the PlanetScale DB — **no separate vendor**) | **Committed** (folded into #2) | $0 incremental | `pg-boss` dep; storage/compute counts against PlanetScale |
| 4 | Marketing landing | Vercel Pro ($20/seat) — **currently comped** | **Committed** (once comp lapses) | $0 now → $20 | `~/tripwire-landing` (Next.js); `~/tripwire-landing/vercel.json`; founder: Pro comped ~3 mo |
| 5 | AI PR review | OpenRouter → `anthropic/claude-fable-5` ($10/$50 per 1M) | **Optional** (gated) | $0 (key unset) | `apps/worker/src/ai/generate.ts` (`createOpenRouter`); `apps/worker/src/index.ts` "OPENROUTER_API_KEY … missing — ai-review will skip"; default `AI_REVIEW_MODEL=anthropic/claude-fable-5` |
| 6 | Product analytics + feature flags | Databuddy (free ≤10k events/mo) | **Optional/Contingent** | $0 (free tier) | `@databuddy/sdk` dep; hardcoded client id; `access-gate` flag |
| 7 | GitHub App (webhooks, reads, checks) | GitHub — free, rate-limited (5,000 req/hr/installation) | **Committed** ($0) | $0 | `GITHUB_APP_*` env; `packages/forge-github` (Octokit reads: diff/commits/contents/contributors) |
| 8 | Feedback delivery | Discord incoming webhook | **Committed** ($0) | $0 | `FEEDBACK_WEBHOOK_URL` env |
| 9 | CI | GitHub Actions (`ci.yml`, `replay.yml`) | **Committed** ($0 in free minutes) | $0 | `.github/workflows/` |
| 10 | Domain(s) | `tripwire.sh` registrar | **Committed** | ~$3/mo amort. (~$40/yr for `.sh`) | landing uses `NEXT_PUBLIC_APP_URL`; www↔apex canonicalization noted in popup work |
| 11 | Delaware C-Corp maintenance | Franchise tax + annual report + registered agent | **Committed** (annual lump) | ~$46/mo amort. (~$550/yr) | founder / corporate, not in repo |
| 12 | v1 parallel run (cutover) | Vercel (v1 app) + Neon (v1 DB) | **Contingent** (until decommission) | ~$0–20/mo | `~/tripwire/vercel.json`; `~/tripwire/.env` `DATABASE_URL=…neon.tech` |
| 13 | Error monitoring | **none budgeted** (no Sentry/etc. in v2) | **Gap** | $0 | absence in deps/env — flagged, not a cost yet |
| 14 | Transactional email | **none in v2** (v1 had it; approval emails not wired) | **Gap** | $0 | no email SDK/env in v2; only Discord webhook |

**Committed cash floor, today:** Railway ~$12 + PlanetScale ~$8 = **~$20/mo** (Vercel comped, AI off, Databuddy free). Amortized corporate + domain adds **~$49/mo** on paper but lands as lumps (mostly the March franchise-tax bill).

**Committed cash floor, post-comp-lapse + Pro seat:** Railway Pro ~$35 (1 seat + usage) + PlanetScale ~$10 + Vercel $20 = **~$45–65/mo** (matches the founder's stated target; the range is Hobby-vs-Pro on Railway and PS-5-vs-PS-10/HA on the DB).

---

## 3. Driver coefficients

What actually moves the bill, strongest first.

| Driver | What it loads | Cost behavior | Coefficient (from empirical v1 data + 2026 pricing) |
|---|---|---|---|
| **PR volume × AI-review-on** | OpenRouter tokens per reviewed PR | **Linear, unbounded, dominant** | **~$0.20/PR** typical (≈15k in + 1.5k out on Fable 5, with prompt caching); **~$0.30** uncached; **$0.50–0.75** for large diffs. ⇒ 1,000 PRs/mo ≈ **$200/mo**. Off ⇒ **$0**. |
| **Concurrent SSE viewers** | Each live dashboard holds **1 direct (non-pooled) PlanetScale connection** (LISTEN) | **Step** — hits a connection ceiling on a small node | PS-5 (512 MB) tops out at low-hundreds of connections; forces PS-10/PS-80 upgrade before CPU or storage ever bind. This is the **real DB cliff**, not storage. |
| **Installations / active orgs** | Repos, webhook subscriptions, DB rows, worker jobs | **Linear, cheap** | Marginal infra per org ≈ **cents/mo** when AI is off (see §5 cost-per-org). |
| **Webhook events** | Append-only event log + worker CPU | **Linear, very cheap** | v1: **18,075 webhooks / 13 mo ≈ 1,390/mo** at 109 active + 1,575 synced repos. At ~1–5 KB/event, storage grows a few MB/mo ⇒ **years to the 10 GB PlanetScale included tier**. Storage is a non-issue at launch scale. |
| **Contributors** | GitHub API reads (contributor list, identity, diff/contents) | **Free but rate-limited** | 5,000 req/hr **per installation** — a per-org ceiling, not a dollar cost. A mass-backfill or a very active monorepo can throttle; not a billing driver. |
| **Landing traffic** | Vercel bandwidth / edge / function invocations | **Flat until huge** | Pro includes 1 TB bandwidth + 10M edge requests; a launch-day HN/PH spike on a static-ish Next.js site won't approach it. Effectively **$20 flat**. |

_Empirical base rates (from the live v1 Neon scan, ~13 months): ~160 PRs/mo · ~1,390 webhooks/mo · 3,451 product events · 109 active repos · 1,575 synced repos · 116 users. These anchor the "conservative" column below._

---

## 4. Milestone projections (×3 scenarios)

Assumptions: Vercel comp **lapsed** by launch (+$20 flat). Two rows per cell — **AI on** (all PRs, $0.20/PR effective) vs **AI off**. PlanetScale steps up only when the SSE-connection ceiling forces it. Corporate/domain amortization (~$49/mo) is **excluded** from these infra totals and tracked separately in §6. Driver = **reviewed PRs/mo** (the dominant knob); repos/orgs scale with it.

| Milestone | Scenario | PRs/mo | Railway | PlanetScale | Vercel | **AI on → total** | **AI off → total** |
|---|---|---|---|---|---|---|---|
| **Pre-launch (now)** | actual | ~160 | $12 | $8 | $0 (comped) | — (AI off) | **~$20** |
| **Launch month** | Conservative | 400 | $25 | $10 (PS-5) | $20 | **~$135** | ~$55 |
| | Expected | 1,200 | $35 | $15 | $20 | **~$310** | ~$70 |
| | Hype (PH/HN) | 6,000 | $70 | $49 (PS-80) | $20 | **~$1,340** | ~$140 |
| **+2 months** | Conservative | 600 | $30 | $10 | $20 | **~$180** | ~$60 |
| | Expected | 2,000 | $40 | $15 | $20 | **~$475** | ~$75 |
| | Hype | 10,000 | $90 | $95 (PS-160) | $20 | **~$2,205** | ~$205 |
| **+6 months** | Conservative | 1,000 | $35 | $15 | $20 | **~$270** | ~$70 |
| | Expected | 4,000 | $60 | $49 (PS-80) | $20 | **~$930** | ~$130 |
| | Hype | 25,000 | $150 | $286 (PS-160 HA) | $25 | **~$5,460** | ~$460 |
| **+24 months** | Conservative | 2,500 | $50 | $49 | $20 | **~$620** | ~$120 |
| | Expected | 12,000 | $120 | $95 | $30 | **~$2,645** | ~$245 |
| | Hype | 100,000 | $400 | $570 (PS-320 HA) | $50 | **~$21,020** | ~$1,020 |

**Read this table as one sentence:** with AI off, Tripwire is a **sub-$500/mo business even at hype scale two years out**; with AI-on-every-PR it is a **cost-of-goods business where the LLM is 80–95% of the bill.** The strategic question is therefore not "how do we host cheaply" (already solved) but "how do we meter AI review."

---

## 5. Cost per org / unit economics

- **AI off:** marginal infra per active org ≈ **$0.10–0.35/org/mo** (e.g. Expected +6mo: ~$130/mo ÷ ~400 active orgs ≈ **$0.32/org**). Effectively free to serve.
- **AI on:** cost is ~entirely that org's own PR volume × ~$0.20. A busy org (30 reviewed PRs/mo) costs **~$6/mo**; a quiet org costs cents. **AI-on orgs are ~20–50× more expensive to serve than AI-off orgs.**

**Pricing implication:** the free/cheap tier can be AI-off (near-zero COGS); AI review is the natural metered/paid feature. Any flat "unlimited AI review" tier is an uncapped liability — a single monorepo with heavy PR traffic can run $50–150/mo alone.

---

## 6. Founder / non-infra costs (separate from the infra meter)

| Item | Amount | Cadence / timing | Notes |
|---|---|---|---|
| Delaware franchise tax | **$400 min** (Assumed Par Value method) | Annual, **due March 1** | Default *Authorized Shares* notice will read ~$170k for a 10M-share startup — **you must recalculate** with Assumed Par Value to get the $400 min. |
| Delaware annual report | **$50** | Annual, due March 1 | Non-exempt domestic corp filing fee. |
| Registered agent | **~$100/yr** ($49–$300 by provider) | Annual (incorporation anniversary) | Budget providers ~$125/yr flat (avoid $0-year-1 renewal traps). |
| Domain `tripwire.sh` | **~$40/yr** | Annual | `.sh` runs pricey vs `.com`; verify at renewal. |
| **Total non-infra** | **~$590/yr ≈ $49/mo amortized** | mostly a **single March lump** | The March franchise-tax bill ≈ a full year of today's infra — plan cash for it. |

Timing note: the **franchise-tax + annual-report lump (next 2027-03-01)** and the **registered-agent renewal** are the only date-certain non-infra hits; miss the March 1 deadline and it's a **$200 penalty + loss of good standing**.

---

## 7. Cliff map (by proximity)

| # | Cliff | Trigger | Impact | Proximity |
|---|---|---|---|---|
| 1 | **Vercel comp lapse** | ~3-month promo ends | +$20/mo committed | **Nearest, date-certain** |
| 2 | **Railway Hobby→Pro** | cofounder write access / spend caps / >Hobby resources | +$15–35/mo (Pro $20/seat + usage) | Weeks–months, team-triggered |
| 3 | **DE franchise tax + report** | annual, 2027-03-01 | ~$450 lump (+$100 agent) | Date-certain, ~7.5 mo |
| 4 | **PlanetScale connection ceiling** | concurrent SSE viewers exhaust direct connections on PS-5 | forced PS-5→PS-10/PS-80 (+$5–44/mo) | Usage-triggered; **the real DB cliff** (not storage) |
| 5 | **AI-review cost ramp** | AI enabled × PR growth | slope, not step — can dominate the entire bill | Immediate the day AI is switched on broadly |
| 6 | **PlanetScale storage 10 GB** | append-only event log | +$0.50/GB/mo | **Far** (years at ~few MB/mo) |
| 7 | **Railway compute overage** | webhook spikes drive worker CPU | smooth, small | Ongoing, minor |

---

## 8. Top 5 cost levers

1. **Gate and cap AI review (by far the biggest).** Keep it per-repo/per-rule opt-in (it's already gated on `OPENROUTER_API_KEY`). Add a **per-org monthly token budget** and a **hard output-token cap** so no single PR/org can run away. This alone separates a $70/mo business from a $900/mo one at expected scale.
2. **Default AI review to a cheaper model tier.** Fable 5 is **$10/$50**. Route routine reviews to **Haiku 4.5 ($1/$5, ~10× cheaper)** or **Sonnet 4.6 ($3/$15, ~3× cheaper)**; reserve Fable 5 for escalations/large diffs. `AI_REVIEW_MODEL` + per-rule override already support this — just change the default.
3. **Turn on prompt caching for AI review.** The rule/system context repeats every call; OpenRouter caching cuts input cost **60–90%**. Effective per-PR cost drops from ~$0.30 toward ~$0.08.
4. **Protect PlanetScale direct connections (defer the DB cliff).** Multiplex/limit SSE LISTEN connections and add idle-SSE timeouts so viewer count doesn't force a node upgrade before CPU/storage ever would. Stay on PS-5/PS-10 longer.
5. **Kill parallel spend fast.** Decommission v1 (Neon DB + v1 Vercel) right after cutover; keep Railway on **1 seat + a hard spend cap** until a cofounder truly needs write access; keep Databuddy on the **free 10k-event tier** (sample events if approaching). Each is a small, certain, recurring saving.

---

## 9. Open input questions (need founder answers to firm up the model)

1. **AI review at launch: on or off? All repos or opt-in?** — This is the single biggest swing (§4). Model currently assumes off-committed, on-as-a-shown-alternative.
2. **PlanetScale tier:** PS-5 single-node ($5, no HA) vs PS-5 3-node HA ($15) vs PS-10 ($10)? For a "never miss an event" product, is HA required at launch?
3. **Railway plan/seats:** stay Hobby, or move to Pro now? How many seats (just you, or +cofounder)?
4. **Vercel comp:** exact lapse date? (Assumed ~3 months.)
5. **v1 decommission:** is v1 (Vercel + Neon) still live and billing? Neon tier? Target shut-off date?
6. **Launch volume:** which scenario column is realistic — pick one so we can commit a single budget line.
7. **Databuddy:** staying free? Forecast monthly event volume vs the 10k free ceiling.
8. **Gaps to fund or defer:** error monitoring (Sentry has a free tier; paid ~$26/mo) and transactional email for approval notices (Resend ~$0–20/mo) are **not** currently in v2 — intentional for launch, or budget them?

---

## Appendix A — Key arithmetic

**AI review per PR (Fable 5, $10 in / $50 out per 1M tokens):**
- Typical PR: 15,000 input + 1,500 output → (15,000 × $10 + 1,500 × $50) / 1e6 = $0.15 + $0.075 = **$0.225** ⇒ ~$0.20 with light caching.
- Large PR: 50,000 input + 4,000 output → $0.50 + $0.20 = **$0.70**.
- Haiku 4.5 ($1/$5) same typical PR: $0.015 + $0.0075 = **$0.0225** (~10× cheaper).
- Prompt caching (60–90% off input): typical PR → ~**$0.08–0.13**.

**Empirical PR base rate:** v1 = 2,080 `pull_request` webhooks / 13 mo ≈ **160 PRs/mo** ⇒ AI-on today would be ~160 × $0.20 = **~$32/mo** (why it's harmless now and dangerous at 10×).

**Railway 24/7 container:** 1 vCPU + 1 GB ≈ $20 (vCPU) + $10 (RAM) = **$30/mo** at full utilization; our 3 services run well under 1 vCPU each early, hence ~$12–35 blended.

**PlanetScale storage runway:** ~1,390 events/mo × ~3 KB ≈ ~4 MB/mo ⇒ **>100 years** to fill the 10 GB included tier from events alone (backups/WAL will bind first, still far).

## Appendix B — Sources (retrieved 2026-07-16)

- Railway pricing — [railway.com/pricing](https://railway.com/pricing), [docs.railway.com/pricing/plans](https://docs.railway.com/pricing/plans) (Hobby $5 + $5 credit; Pro $20/seat + $20 credit; RAM ~$10/GB-mo, vCPU ~$20/vCPU-mo, volume ~$0.15/GB-mo)
- PlanetScale Postgres pricing — [planetscale.com/pricing](https://planetscale.com/pricing), [planetscale.com/docs/postgres/pricing](https://planetscale.com/docs/postgres/pricing) (no free tier; PS-5 $5 / HA $15; PS-10 $10; PS-80 $49; 10 GB storage incl. then $0.50/GB; 100 GB egress incl. then $0.06/GB; backups $0.023/GB)
- Vercel Pro pricing — [vercel.com/pricing](https://vercel.com/pricing), [vercel.com/docs/pricing](https://vercel.com/docs/pricing) ($20/seat + $20 credit; 1 TB bandwidth + 10M edge requests incl.; overage bw $0.15/GB, invocations $0.60/M; commercial use requires Pro)
- OpenRouter — Claude Fable 5 — [openrouter.ai/anthropic/claude-fable-5](https://openrouter.ai/anthropic/claude-fable-5) ($10 input / $50 output per 1M; 1M context; +5.5% card fee)
- OpenRouter — cheaper Claude tiers — [openrouter.ai/anthropic/claude-haiku-4.5](https://openrouter.ai/anthropic/claude-haiku-4.5) ($1/$5), [openrouter.ai/anthropic/claude-sonnet-4.6](https://openrouter.ai/anthropic/claude-sonnet-4.6) ($3/$15), [openrouter.ai/anthropic/claude-opus-4.8](https://openrouter.ai/anthropic/claude-opus-4.8) ($5/$25)
- Databuddy pricing — [databuddy.cc/pricing](https://www.databuddy.cc/pricing) (free ≤10k events/mo; tiered overage to 100M)
- Delaware C-Corp — [corp.delaware.gov/paytaxes](https://corp.delaware.gov/paytaxes/), [revenue.delaware.gov/business-tax-forms/franchise-taxes](https://revenue.delaware.gov/business-tax-forms/franchise-taxes/) (franchise tax $400 min Assumed Par Value / $175 Authorized Shares; annual report $50; due March 1; $200 late penalty), registered agent survey — [registeredagentcost.com/delaware-registered-agent-cost](https://registeredagentcost.com/delaware-registered-agent-cost/) (~$49–$300/yr)

_Third-party aggregators were used to triangulate; primary vendor pages are the authority. Re-verify before committing a budget — Vercel and PlanetScale both restructured pricing within the last ~18 months._
