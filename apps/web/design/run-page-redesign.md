# Run page redesign — design spec

> Deliverable: a design an engineer builds from. Not production code. No routes,
> components, or contracts are modified by this document.
>
> Surface: `/runs/{id}` (`apps/web/src/components/runs/`). One URL, two audiences,
> two render depths (§10). The run page is the **receipt** a PR's bot comment
> links to via the "View on Tripwire" button (§7).

---

## 0. What we're designing against (grounding)

Everything below is designed around a **real run** in the dev DB
(`019f5388-…f575f9`, `Boring-Software-Inc/scratch #1`, verdict **block**):

| node | kind | status | evidence (real) |
|---|---|---|---|
| `trigger` | trigger | pass | `{matched:true}` |
| `account-age` | rule | pass | `{minDays:7, accountAgeDays:2037}` |
| `crypto` (`crypto-address@1`) | rule | **fail** | `matches:[{kind:eth,value:0xAb58…,location:DONATE.md},{kind:btc,value:bc1q…,location:DONATE.md}]` |
| `honeypot` | rule | **fail** | `{touched:[".github/workflows/exfil.yml"]}` |
| `max-files` (`max-files-changed@1`) | rule | pass | `{max:200, filesChanged:2}` |
| `english` (`english-only@1`) | rule | pass | `{ratio:0, sample:"fix typo", lettersExamined:7}` |
| `ai-review` | rule | **fail** | summary + 3 critical findings, confidence 1.0, `trace:{model:"x-ai/grok-4.5", usage:{totalTokens:2207}, steps:[…submit_review toolCall…]}` |
| `gate` | gate | **fail** | `{outcome:"fail"}` |
| `block` | action | pass | executed |

Actions recorded: `block` executed · `comment` executed · `set-check` executed.

Degradation is real too (`019f5391-…70aa`): synthetic step `run:degradation` with
`{ruleNodes:3, skippedRules:2, degradedReads:["diff","contributor","commits"]}`.
No live `needs_review`/`paused` or `deny-floor` run exists yet — those states are
designed from the schema (`verdictSchema` includes `needs_review`;
`run.status==="paused"`) and from `describeSyntheticStep` in
`apps/web/src/lib/synthetic-steps.ts`.

### Design tokens (locked — from the `tripwire-design` skill, do not invent)

- Near-monochrome zinc/grey. **Brand blue (`brand`) is punctuation, never a fill.**
- **Severity is the only earned hue**, and only as a *dot*, not a filled pill:
  `critical bg-red-500` · `warn/high bg-amber-500` · `info/medium
  muted-foreground/60` · `low muted-foreground/30`.
- Verdict state color is allowed as a **tinted background at 10% + text** and a
  **status dot**, matching the current `VERDICT_STYLE`
  (`emerald` pass / `red` block / `amber` sent-to-review). Keep it restrained.
- Body 13px, weight 450. Mono = Geist Mono (`font-mono`, `-0.02em`). Brand
  wordmark = Silkscreen (`font-pixel`).
- `rounded-md` default; `rounded-lg`/`rounded-xl` for panels; `rounded-full` for
  dots/pills. Spacing tight: `gap-1`/`gap-2` in rows, `gap-4` between blocks.
- Motion: `transition-colors` everywhere; entrances via `motion` springs
  (`stiffness 320–480, damping 34–44`); respect `prefers-reduced-motion`.

### Voice (locked — `.claude/rules/constitution.md`, non-negotiable)

Terse, lowercase, zero exclamation marks. **"blocked" / "passed" / "sent to
review"** — never rejected/denied/failed. The product is a "contribution
gatekeeper" / "a firewall for your repo". The person is a **contributor**; the PR
is a **change request**. Every string in every mockup below already obeys this.

---

## 1. Design direction (the one idea)

**A run is a workflow execution — render it as the path the change took, not a
stack of JSON cards.** The current page (`run-page.tsx`) is a flat list of
`StepCard`s, each a bordered card, and the ai-review card nests *another* bordered
block inside it (`AiFindings`) — the "card-in-card" the brief calls out.

The redesign is a **vertical flow rail**: `trigger → rules → gate → action`, top
to bottom, one continuous spine. Each node is a **row on the rail**, not a card.
The **blocking path is visually obvious**: failing nodes carry a red dot and a red
spine segment; the gate shows *which* rules floored it; the action at the bottom
is the verdict made concrete.

Why a rail and not a literal left-to-right DAG:

- The default workflow fans 6 rules in parallel off one trigger into one gate
  (`DEFAULT_WORKFLOW`). A true 2-D graph is unreadable on a 375px phone and only
  marginally better on desktop for a fan-in this shallow.
- The rail keeps the **"here's the path, here's where it stopped"** feeling while
  staying a single responsive column. Parallel rules render as a **bracketed group
  on the rail** (one trigger in, one gate out, rules stacked between) — the
  parallelism is shown by the bracket, not by x-position.
- It degrades to mobile with zero layout change (it's already one column).

Desktop adds an **evidence column** to the right of each rule row (progressive
disclosure inline); mobile collapses evidence under a tap. Same skeleton, same
components — desktop is the rail at `max-w-3xl`, mobile is the rail full-bleed.

```
   ●  the rail spine (a 2px vertical line in `border`, red where the path failed)
   │
   ●──  node row: [dot] [label] ……………… [outcome] [meta]
   │        └ plain-english one-liner (public)  /  + evidence disclosure (maintainer)
```

---

## 2. Anatomy (shared skeleton, both audiences)

```
┌───────────────────────────────────────────────────────────┐
│  BRAND BAR        tripwire ▮  · a firewall for your repo    │  §6
├───────────────────────────────────────────────────────────┤
│  VERDICT BANNER                                             │  §4.1
│  ● blocked   this change request can't be merged.           │
│  Boring-Software-Inc/scratch  ·  change request #1          │  §4.2 (header)
│  57m ago  ·  ce84940                                        │
├───────────────────────────────────────────────────────────┤
│  THE RAIL                                                   │  §3
│  ● trigger        change request opened                     │
│  │                                                          │
│  ├─ rules ─────────────────────────────────────────────┐   │
│  │ ● account age      passed   account is 5y old; …      │   │
│  │ ● crypto address   blocked  2 crypto addresses in …   │   │
│  │ ● honeypot         blocked  touched a protected path  │   │
│  │ ● max files        passed   2 files; limit is 200     │   │
│  │ ● english only     passed   title is latin-script     │   │
│  │ ● ai review        blocked  malicious workflow …       │   │
│  └────────────────────────────────────────────────────┘   │
│  │                                                          │
│  ● gate (all must pass)   blocked   3 of 6 rules blocked   │  §4 gate node
│  │                                                          │
│  ● action                 blocked   merge held             │
├───────────────────────────────────────────────────────────┤
│  ACTIONS TAKEN (maintainer only, or condensed line public) │  §5
├───────────────────────────────────────────────────────────┤
│  FOOTER   powered by tripwire — a firewall for your repo    │  §6
└───────────────────────────────────────────────────────────┘
```

Public and maintainer share this skeleton exactly. The difference is **depth per
row**, delivered by progressive disclosure — never a different page (§10, same
URL, deeper render). See the audience matrix (§8).

---

## 3. The rail — node/step component

One component, `RailNode`, replaces `StepCard`. It is a **row on a spine**, not a
card. No border, no `bg-card` per node — flattening the double-card. Elevation
comes from the spine + hover (`hover:bg-surface-1`), matching how the current
`actions` list already renders rows.

### 3.1 Node states (the dot + spine encode the path)

| status | dot | spine segment below | label suffix (public) |
|---|---|---|---|
| `pass` | `bg-emerald-500` | `border` (neutral) | `passed` |
| `fail` | `bg-red-500` | `bg-red-500/60` (the failing path lights up) | `blocked` |
| `skipped` | `bg-muted-foreground/40` | neutral, dashed | `skipped` |
| `disabled` | `bg-muted-foreground/30` ring only | neutral, dashed | `off` |
| `paused` | `bg-amber-500` (pulse via `motion`) | `bg-amber-500/60` | `sent to review` |

The dot reuses the exact `STATUS_DOT` map already in `step-card.tsx` (`pass`/
`fail`/`skipped`/`paused`) — extend with `disabled`. The **spine coloring is the
new signal**: trace red from the first failing rule down through gate → action so
the eye follows the block to its conclusion.

### 3.2 One node row (desktop)

```
 ●  crypto address                                  blocked   4ms
 │  2 crypto addresses in DONATE.md                          [▸ evidence]
```

- `●` — `size-1.5 rounded-full` status dot, on the spine.
- `crypto address` — human rule name (from `RULE_CATALOG[].name`), **not**
  `default@1:crypto` and not `crypto-address@1`. `font-medium`.
- `blocked` / `passed` — outcome word, `text-xs`, colored to match the dot
  (`text-red-600 dark:text-red-400` etc.). Right-aligned cluster.
- `4ms` — `durationMs`, `text-muted-foreground text-xs font-mono`. **Maintainer
  only** (see §8); hidden on public.
- Second line — the **plain-english one-liner** (§7). Always present, both
  audiences. `text-muted-foreground` on pass, `foreground` on block (the reason a
  contributor is here should not be greyed out).
- `[▸ evidence]` — the disclosure toggle. **Maintainer only.** Expands the raw
  evidence panel inline (§4.3).

### 3.3 The parallel-rules bracket

Rules that fan off the trigger render inside a **labeled bracket** on the rail —
a thin `border-l` bracket with a `rules` caption, communicating "these ran in
parallel; order is not causal." Node rows inside are ordered **failing first,
then passing** on the public view (lead with why it's blocked), but **DAG /
`started_at` order** on the maintainer view (debugging wants execution order).
This is the one place the two audiences reorder; everything else is identical.

Derivation: group by `nodeKind === "rule"` between the trigger and the gate.
Trigger, gate, and action nodes sit on the bare spine above/below the bracket.

---

## 4. Component specs

### 4.1 Verdict banner (`RunVerdictBanner`) — new

Replaces the current `<h1>Run</h1>` + pill. The verdict is the headline, not a
tag next to the word "Run".

```
┌─────────────────────────────────────────────────────────┐
│  ●  blocked                                               │
│     this change request can't be merged.                 │
└─────────────────────────────────────────────────────────┘
```

- Full-width panel, `rounded-lg`, tinted `bg-{verdict}/10`, `text-{verdict}`
  headline — reuse the existing `VERDICT_STYLE` map.
- Dot + verdict word in `font-pixel`-adjacent weight? No — keep verdict in
  `font-medium text-2xl` sans; pixel is reserved for the brand wordmark only.
- Sub-line: one constitution-voice sentence, `text-sm text-muted-foreground`:
  - block → `this change request can't be merged.`
  - pass → `this change request passed all rules.`
  - needs_review → `sent to a maintainer for review.`
  - (paused overrides) → `waiting on a maintainer decision.`
- When `status==="paused"` and no terminal verdict yet, banner is amber "sent to
  review" with the pulsing dot.

### 4.2 Header (`RunHeader`) — redesign of the jargon-soup line

Current: `Boring-Software-Inc/scratch #1 · 57m ago · 2aa6efc` — one grey run-on.
Redesign splits **what/where/when** onto labeled, scannable metadata, sha demoted:

```
Boring-Software-Inc/scratch  ·  change request #1
57m ago  ·  ce84940
```

- Line 1: `repoFullName` in `text-foreground`, then `change request #{subjectNumber}`
  (never "PR #1", never "#1" bare — the constitution's subject rule). If
  `subjectNumber` is null, omit.
- Line 2: `formatRelativeTime(createdAt)` + short sha. **Sha demoted**:
  `font-mono text-xs text-muted-foreground/70`, `headSha.slice(0,7)`, no leading
  jargon. A short sha "is fine but shouldn't be shouting."
- Sits directly under the verdict banner, `text-sm`. On maintainer view the sha
  is a link to the commit on the forge (needs `repoFullName` + `headSha`); on
  public it's plain text (no forge deep-links for strangers).

### 4.3 Evidence disclosure pattern (`EvidenceDisclosure`) — new, replaces `EvidenceView`

The core fix for "raw JSON dumps in the public view." Three layers:

1. **Plain-english one-liner** — always rendered, both audiences, on the node row
   (§3.2, §7). This is what a non-technical contributor reads. No JSON.
2. **Structured evidence chips** — maintainer, on toggle. A small typed rendering
   *per rule* before the raw dump: e.g. crypto → two rows `eth 0xAb58… · DONATE.md`
   / `btc bc1q… · DONATE.md`; honeypot → `.github/workflows/exfil.yml`; ai-review
   → the findings list (see 4.4). Uses mono for values, `bg-surface-1 rounded-md`.
3. **Raw JSON** — maintainer, nested inside a second `<details>` labeled
   `raw evidence`. This is where today's `EvidenceView` `<pre>` lives — kept for
   debugging, but demoted two clicks deep. `overflow-x-auto`, `font-mono text-xs`.

Disclosure is a `<details>`/`Disclosure` row with a `▸` chevron rotating on open
(`transition-transform`). Closed by default on both audiences (dense-by-default);
the one-liner already carries the signal. Public view renders **layer 1 only** —
no toggle appears at all.

### 4.4 AI findings (`AiFindings`) — kept, re-skinned onto the rail

`AiFindings` already renders summary + confidence + severity-dotted findings, and
is correct in spirit. Changes:

- Drop the wrapping `bg-surface-1 rounded-md` block when it sits **inside** a
  disclosure (kills a card layer); keep it when it's the public inline render.
- Public: summary sentence + confidence + findings list (file:line + note +
  severity dot). This is **findings, not trace** — `toPublicRunView` /
  `stripAiReviewTrace` already strips `evidence.trace`, so the public component
  literally cannot render tokens/model/tool-calls. Design assumes that guarantee.
- Maintainer: same findings, **plus** a `model trace` disclosure below —
  `model: x-ai/grok-4.5`, `2,207 tokens`, and the `submit_review` tool-call step.
  This is the `trace` object that's absent from the public payload.
- Severity dot stays the `SEVERITY_DOT` map (`critical`/`warn`/`info`). Confidence
  renders `100% confident` (existing copy) — acceptable, terse, no exclamation.

### 4.5 Synthetic steps (`SyntheticStepRow`) — kept distinct, re-skinned

`describeSyntheticStep` returns deny-floor / degradation with title + detail. Per
VERIFICATION-QUEUE #11 they "must read distinctly, never like a graph node." On
the rail they render **off-spine** — a full-width callout panel *between* the rail
and the actions, `border-l-2` in red (deny-floor) or amber (degradation),
`bg-{color}/5`, **no status dot on the spine**, so they never look like a node:

```
▍ denied by maintainer                                    (deny-floor, red)
  no deny edge drawn — the deny floor blocked this change by
  default. deny never fails open.

▍ evaluation degraded                                     (degradation, amber)
  2 of 3 rules skipped (degraded reads: diff, contributor,
  commits) — the fail-closed floor sent this run to review
  instead of passing on guesswork.
```

Copy comes verbatim from `synthetic-steps.ts` (already constitution-voiced).
Both audiences see these (they explain the verdict; they're not internals).

### 4.6 Actions taken (`RunActions`)

- Maintainer: the existing row list (`block` / `comment` / `set-check` with
  `executed`/`superseded` status), re-skinned to match the rail rows (mono kind,
  right-aligned muted status). Section caption `actions taken`.
- Public: collapsed to **one plain line** under the verdict, no per-action detail:
  block → `the merge is held and a check was posted on the change request.`
  A contributor doesn't need `set-check executed`. If you'd rather not special-case,
  hide the section entirely on public — the verdict banner already says "can't be
  merged." **Recommendation: hide on public.**

### 4.7 Reusable vs. new

| component | source | verdict |
|---|---|---|
| `Badge` | `#/components/ui/badge` | **reuse** for verdict/status pills |
| `Card` | `#/components/ui/card` | reuse for the banner panel only; **not** per-node |
| `Separator` | `#/components/ui/separator` | reuse between sections |
| `Skeleton` | `#/components/ui/skeleton` | reuse in the loading state |
| `Tooltip` | `#/components/ui/tooltip` | reuse for sha / timing hovers (maintainer) |
| `Button` | `#/components/ui/button` | reuse for "sign in for full detail" CTA (public→maintainer) |
| `AiFindings` | `components/runs/ai-findings.tsx` | **keep**, re-skin (§4.4) |
| `describeSyntheticStep` | `lib/synthetic-steps.ts` | **keep** as-is (logic), new presenter |
| `EvidenceView` | `components/runs/evidence-view.tsx` | **absorb** into `EvidenceDisclosure` layer 3 |
| `StepCard` | `components/runs/step-card.tsx` | **replace** with `RailNode` |
| `RunPage`/`RunBody` | `components/runs/run-page.tsx` | **rework** into rail composition |
| `RailNode` | — | **new** |
| `RailBracket` (parallel rules) | — | **new** |
| `RunVerdictBanner` | — | **new** |
| `RunHeader` | — | **new** |
| `RunBrandBar` | — | **new** (§6) |
| `EvidenceDisclosure` | — | **new** |
| `plain-english-rule.ts` (one-liner map) | — | **new** `#/lib` helper (§7) |

> Note: `@tripwire/ui` is currently scaffolded-empty; the real primitives live in
> `apps/web/src/components/ui/`. Build the new run components in
> `apps/web/src/components/runs/`.

---

## 5. Plain-english one-liner mapping (§7's core ask)

A pure function `describeRule(ruleId, evidence, status) → string`, one entry per
rule, derived from evidence shapes (`RULE_CATALOG` + rule config schemas in
`packages/contracts/src/rules.ts`). Lowercase, terse, no JSON, constitution voice.
`{…}` = values pulled from evidence.

| rule | passed one-liner | blocked one-liner |
|---|---|---|
| `account-age` | `account is {accountAgeDays humanized} old; repo requires {minDays}d` | `account is {accountAgeDays}d old; this repo requires {minDays}d` |
| `crypto-address` | `no crypto addresses found` | `{matches.length} crypto address{es} in {distinct locations} ({kinds})` |
| `honeypot` | `touched no protected paths` | `touched a protected path: {touched[0]}{ +N more}` |
| `max-files-changed` | `{filesChanged} file{s} changed; limit is {max}` | `{filesChanged} files changed; limit is {max}` |
| `english-only` | `title is latin-script` | `title is {round(ratio*100)}% non-latin; limit is {round(maxNonLatinRatio*100)}%` |
| `ai-review` | `ai review found nothing blocking` | the model `summary` sentence verbatim |
| `min-merged-prs` | `{mergedPrs} merged change requests here; needs {min}` | `{mergedPrs} merged change requests here; this repo needs {min}` |
| `pr-rate-limit` | `{count} change requests in {windowHours}h; under the cap of {maxPerWindow}` | `{count} change requests in {windowHours}h; the cap is {maxPerWindow}` |
| `profile-readme` | `profile has {length} chars of text` | `profile has {length} chars; needs at least {minLength}` |

Real render for the grounding run:

- account age → `account is 5y old; repo requires 7d` (pass)
- crypto address → `2 crypto addresses in DONATE.md (eth, btc)` (blocked)
- honeypot → `touched a protected path: .github/workflows/exfil.yml` (blocked)
- max files → `2 files changed; limit is 200` (pass)
- english only → `title is latin-script` (pass)
- ai review → `malicious workflow exfiltrates secrets and title hides crypto spam docs` (blocked)

`skipped` renders `couldn't evaluate — {reason}` (from the `RuleResult.reason`).
Evidence shapes: `min-merged-prs`, `pr-rate-limit`, `profile-readme` field names
(`mergedPrs`, `count`, `length`) are inferred from their config schemas — confirm
against the core rule definitions when wiring; the copy pattern holds regardless.

---

## 6. Brand presence for the public view

Today: only a "powered by tripwire" footer link — the one page strangers see has
no top-of-funnel identity. Add a **quiet brand bar**, in-aesthetic, not a landing
page.

- **Top brand bar** (`RunBrandBar`), public view only, above the verdict banner:
  a thin row, `border-b`, `h-12`, containing the **`tripwire` wordmark in
  `font-pixel` `text-sm`** (matches the login page's `font-pixel` wordmark and the
  PR button's Geist-Pixel dither aesthetic) + the tagline
  `a firewall for your repo.` in `text-muted-foreground text-xs`. Right side: a
  ghost `Button` `sign in` (maintainers who land here go to their dashboard). No
  nav, no marketing.
- The maintainer view **does not** render the brand bar — it renders inside
  `DashboardLayout` (topbar + side panel already brand the app).
- Keep the existing **footer** on public (`powered by tripwire — {tagline}`,
  linking `siteConfig.githubRepositoryUrl`). Two light touches (pixel wordmark top,
  link bottom) is enough; the run content stays the hero.
- The verdict banner's dot + the dithered feel of `AiFindings`/severity dots carry
  the product's texture without a decorative hero. Do **not** add the dither chart
  kit here — a run isn't a metric.

---

## 7. Public — desktop + mobile (the blocked contributor)

### 7.1 Public desktop (`max-w-2xl` centered — narrower than maintainer's 3xl; a
contributor reads, doesn't scan a table)

```
┌──────────────────────────────────────────────────────────────────┐
│  tripwire ▮   a firewall for your repo.                  [ sign in ]│  brand bar
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │ ●  blocked                                                │    │  verdict banner
│   │    this change request can't be merged.                   │    │  (red/10 tint)
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│   Boring-Software-Inc/scratch   ·   change request #1              │  header
│   57m ago   ·   ce84940                                            │
│                                                                    │
│   ● change request opened                                          │  trigger
│   │                                                                │
│   ├ rules ───────────────────────────────────────────────────┐    │
│   │ ● crypto address        blocked                           │    │  ← failing
│   │ │   2 crypto addresses in DONATE.md (eth, btc)            │    │    first
│   │ ● honeypot              blocked                           │    │
│   │ │   touched a protected path: .github/workflows/exfil.yml │    │
│   │ ● ai review             blocked                           │    │
│   │ │   malicious workflow exfiltrates secrets and title      │    │
│   │ │   hides crypto spam docs                                │    │
│   │ │     ● .github/workflows/exfil.yml:7                     │    │  findings
│   │ │       curl-pipe-sh downloads and runs remote payload    │    │  (critical dot)
│   │ │     ● DONATE.md  unsolicited crypto addresses           │    │
│   │ │     ● .github/workflows/exfil.yml  title lies about diff│    │
│   │ │     100% confident                                      │    │
│   │ ● account age           passed                            │    │  ← passing
│   │ │   account is 5y old; repo requires 7d                   │    │
│   │ ● max files             passed                            │    │
│   │ │   2 files changed; limit is 200                         │    │
│   │ ● english only          passed                            │    │
│   │ │   title is latin-script                                 │    │
│   └──────────────────────────────────────────────────────────┘    │
│   │                                                                │
│   ● gate · all must pass       blocked   3 of 6 rules blocked      │
│   │                                                                │
│   ● action                     blocked   merge held               │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│           powered by tripwire — a firewall for your repo.          │  footer
└──────────────────────────────────────────────────────────────────┘
```

No `[▸ evidence]` toggles, no `4ms` timings, no model/token trace, no raw JSON —
the public payload never even carries the trace (`stripAiReviewTrace`). The red
spine runs `crypto → honeypot → ai review → gate → action`; passing rules keep a
neutral spine.

### 7.2 Public mobile (375px, full-bleed, one column — the rail is already mobile)

```
┌────────────────────────────┐
│ tripwire ▮          [in]   │
├────────────────────────────┤
│ ● blocked                  │
│   this change request      │
│   can't be merged.         │
│                            │
│ Boring-Software-Inc/scratch│
│ change request #1          │
│ 57m ago · ce84940          │
│────────────────────────────│
│ ● change request opened    │
│ │                          │
│ │ rules                    │
│ ● crypto address  blocked  │
│ │  2 crypto addresses in   │
│ │  DONATE.md (eth, btc)    │
│ ● honeypot        blocked  │
│ │  touched a protected     │
│ │  path:                   │
│ │  .github/workflows/      │
│ │  exfil.yml               │
│ ● ai review       blocked  │
│ │  malicious workflow      │
│ │  exfiltrates secrets…    │
│ │   ● exfil.yml:7          │
│ │     curl-pipe-sh runs    │
│ │     remote payload       │
│ │   ● DONATE.md  crypto    │
│ │   ● exfil.yml  lies      │
│ │   100% confident         │
│ ● account age     passed   │
│ │  account is 5y old;      │
│ │  repo requires 7d        │
│ ● max files       passed   │
│ ● english only    passed   │
│ │                          │
│ ● gate            blocked  │
│ │  3 of 6 blocked          │
│ ● action          blocked  │
│    merge held              │
│────────────────────────────│
│ powered by tripwire        │
└────────────────────────────┘
```

Mobile drops the `rules` bracket border to save horizontal room (caption only),
truncates long file paths with a middle-ellipsis, and lets passing rules collapse
their one-liner to save vertical space (`account age passed` — tap to expand the
reason). The failing path stays fully expanded. The outcome word wraps under the
label when the row is tight.

---

## 8. Maintainer — desktop + mobile (the debugging surface)

Same skeleton, **inside `DashboardLayout`** (topbar + side panel), `max-w-3xl`,
rows ordered by execution (`started_at`), every disclosure available.

### 8.1 Maintainer desktop

```
[ DashboardLayout topbar ─────────────────────────────────────────── ]
[ side  ]  ┌────────────────────────────────────────────────────────┐
[ panel ]  │ ●  blocked   this change request can't be merged.       │
[        ]  └────────────────────────────────────────────────────────┘
[        ]  Boring-Software-Inc/scratch · change request #1
[        ]  57m ago · ce84940↗ (links to commit)      workflow default@1
[        ]
[        ]  ● change request opened            pass    0ms
[        ]  │   trigger matched: change-request.opened
[        ]  │
[        ]  ├ rules ───────────────────────────────────────────────┐
[        ]  │ ● account age        passed   1ms      [▸ evidence]  │
[        ]  │ │   account is 5y old; repo requires 7d              │
[        ]  │ ● crypto address     blocked  4ms      [▾ evidence]  │  ← open
[        ]  │ │   2 crypto addresses in DONATE.md (eth, btc)       │
[        ]  │ │   ┌──────────────────────────────────────────────┐ │
[        ]  │ │   │ eth  0xAb5801a7D398…aeC9B   DONATE.md         │ │  structured
[        ]  │ │   │ btc  bc1qar0srrr7xf…5mdq    DONATE.md         │ │  chips
[        ]  │ │   │ ▸ raw evidence                               │ │  layer 3
[        ]  │ │   └──────────────────────────────────────────────┘ │
[        ]  │ ● honeypot           blocked  2ms      [▸ evidence]  │
[        ]  │ │   touched a protected path: .github/workflows/…    │
[        ]  │ ● max files          passed   1ms      [▸ evidence]  │
[        ]  │ ● english only       passed   1ms      [▸ evidence]  │
[        ]  │ ● ai review          blocked  1.9s     [▾ evidence]  │
[        ]  │ │   malicious workflow exfiltrates secrets and title │
[        ]  │ │   hides crypto spam docs           100% confident  │
[        ]  │ │   ● exfil.yml:7  curl-pipe-sh … remote payload     │
[        ]  │ │   ● DONATE.md    unsolicited crypto addresses      │
[        ]  │ │   ● exfil.yml    title lies about the diff         │
[        ]  │ │   ▾ model trace                                    │
[        ]  │ │     model  x-ai/grok-4.5     2,207 tokens          │
[        ]  │ │     step 1 · submit_review (block, conf 1.0)       │
[        ]  │ │     ▸ raw trace json                               │
[        ]  └────────────────────────────────────────────────────┘
[        ]  │
[        ]  ● gate · all-of        blocked  0ms      3 of 6 blocked
[        ]  │
[        ]  ● action · block       blocked  merge held
[        ]
[        ]  actions taken
[        ]  block      executed        set-check   executed
[        ]  comment    executed
[        ]
[        ]  workflow snapshot        [▸ view DAG json]     (maintainer only)
[        ]  └──────────────────────────────────────────────────────────┘
```

Maintainer-only additions over public: `durationMs` per row, sha→commit link,
`workflow default@1` label + `[▸ view DAG json]` from `run.snapshot` (null on
public per `toPublicRunView`), `[▸ evidence]` on every rule → structured chips →
raw JSON, the `model trace` disclosure (model / tokens / tool-call steps / raw
trace), and the full `actions taken` grid. No brand bar (the dashboard chrome
brands it).

### 8.2 Maintainer mobile

Identical rail to public mobile, but each rule row carries a trailing `▸` that
expands evidence full-width below the row (chips → raw), timings shown as a small
mono suffix, and the `workflow snapshot` / `actions taken` sections stack at the
bottom. The `DashboardLayout` mobile footer nav is present. Because evidence is
tap-to-expand, the default collapsed view is as calm as the public one — depth on
demand.

---

## 9. Empty / edge states

Each is the **same skeleton** with the banner + rail adapting. All copy is
constitution-voiced.

### 9.1 Run not found (and denied — indistinguishable by design, §10)

`loadRunView` returns `null` for missing **and** for denied private-repo runs — a
denied run must be indistinguishable from a missing one. One state, no leak:

```
┌────────────────────────────────────────────┐
│              tripwire ▮                     │
│                                            │
│         run not found                      │
│   this run doesn't exist, or it's private  │
│   and you're not signed in.                │
│                                            │
│                [ sign in ]                 │
└────────────────────────────────────────────┘
```

Centered, `text-muted-foreground`, brand wordmark on top (still top-of-funnel).
The `sign in` CTA covers the "it's a private run and I'm the maintainer" case
without confirming the run exists. Replaces today's bare `run not found.` line.

### 9.2 Sent to review / paused (awaiting moderation)

`status==="paused"` (or `verdict==="needs_review"`), amber throughout. Banner is
amber "sent to review" with the **pulsing dot** (`motion`, respect reduced-motion),
sub-line `waiting on a maintainer decision.` The action node renders `paused`
(amber dot on the spine). Maintainer view surfaces approve/deny controls **only
when session-gated** — those mutations are gated (§10); public sees the paused
state read-only, no buttons.

```
│ ● sent to review                              │  amber /10
│   waiting on a maintainer decision.           │
│ …rails…                                       │
│ ● ai review        sent to review   needs_review
│ │   flagged for a human — confidence below     │
│ │   the auto-block threshold                    │
│ ● gate             paused ◐                    │  pulsing
│ ● send to review   paused   awaiting decision  │
│  ── (maintainer, session only) [approve][deny] │
```

### 9.3 Degraded run

`run:degradation` synthetic step present. The rail renders the skipped rules with
`bg-muted-foreground/40` dots + dashed spine (`skipped` state) and `couldn't
evaluate` one-liners; the **degradation callout** (§4.5) sits below the rail in
amber, verbatim from `describeSyntheticStep`. Verdict banner reflects the actual
outcome (often `sent to review` — the fail-closed floor). Both audiences see it.

```
│ ● sent to review                              │
│   evaluation degraded — sent to a maintainer. │
│ …rules: some ● skipped (dashed spine)…        │
│ ▍ evaluation degraded                         │  amber callout, off-spine
│   2 of 3 rules skipped (degraded reads: diff, │
│   contributor, commits) — the fail-closed     │
│   floor sent this run to review instead of    │
│   passing on guesswork.                       │
```

### 9.4 Deny-floor blocked run

`run:deny-floor` synthetic step. Verdict banner `blocked`. The **deny-floor
callout** (§4.5) renders in **red**, off-spine, verbatim: "denied by maintainer —
no deny edge drawn — the deny floor blocked this change by default. deny never
fails open." The rail's rules may all show pass (that's the point — a maintainer
deny floored it regardless), so the deny-floor callout is the load-bearing
explanation, visually separated so it never reads as a rule node.

### 9.5 Passed run

Banner emerald `passed` / `this change request passed all rules.` Every rule dot
emerald, spine stays neutral (no failing path to trace). Terse and calm — a passed
run is the boring happy path. Actions: `comment` / `set-check` executed, no block.

### 9.6 Loading

Keep `RunPageSkeleton`'s shape (`animate-pulse` `bg-surface-1`): a banner bar +
6 rail-row placeholders. Reuse `#/components/ui/skeleton`. Public and maintainer
share it (access isn't known until the query resolves).

---

## 10. Audience matrix — what each section shows

| section | public (no session, public repo) | maintainer (session / open-dev) |
|---|---|---|
| brand bar (top) | **shown** (pixel wordmark + tagline + sign in) | hidden (DashboardLayout brands it) |
| verdict banner | shown | shown |
| header repo/`change request #` | shown | shown |
| commit sha | shown, plain text, demoted | shown, links to commit on forge |
| workflow id (`default@1`) | hidden | shown |
| trigger / gate / action nodes | shown (label + outcome) | shown (+ `durationMs`, gate mode) |
| rule row: name + outcome | shown | shown |
| rule row: plain-english one-liner | **shown** (the whole point) | shown |
| rule row: `durationMs` | hidden | shown |
| rule row: `[▸ evidence]` toggle | **hidden** | shown |
| structured evidence chips | hidden | shown (on toggle) |
| raw evidence JSON | hidden | shown (nested `▸ raw evidence`) |
| ai-review summary + findings + confidence | **shown** | shown |
| ai-review model trace (model/tokens/tool-calls) | **hidden** (`stripAiReviewTrace` removes it) | shown (`▾ model trace`) |
| synthetic callouts (deny-floor / degradation) | shown | shown |
| actions taken | hidden (or one condensed line) | shown (full grid) |
| workflow snapshot DAG json | hidden (`snapshot:null` public) | shown (`▸ view DAG json`) |
| approve / deny controls (paused) | hidden | shown (session-gated mutation, §10) |
| footer "powered by tripwire" | shown | hidden |
| rule ordering | failing-first (lead with why) | execution order (`started_at`) |

The split is enforced server-side already: `toPublicRunView` sets
`access:"public"`, `snapshot:null`, and strips each ai-review step's `trace`. The
UI keys every maintainer-only affordance off `run.access === "full"` — one flag,
no second page.

---

## 11. Build notes for the engineer

- Replace `StepCard` with `RailNode` + `RailBracket`; keep `AiFindings` and
  `describeSyntheticStep`; fold `EvidenceView` into `EvidenceDisclosure` layer 3.
- Add `#/lib/plain-english-rule.ts` (`describeRule`) — pure, unit-testable over
  the same evidence fixtures the rules already have; import `RULE_CATALOG` for
  names/blurbs. Keep it a value-returning function (no throws) per the errors law.
- `run.access === "full"` is the single gate for all maintainer depth. Never fetch
  a separate "maintainer run" — the server already shaped the payload (§10).
- Rail spine color is derived, not stored: walk steps, and once a `fail` rule is
  seen, the spine from there down through gate → action is `red/60`.
- Verdict/status color reuses `VERDICT_STYLE`; dots reuse `STATUS_DOT` /
  `SEVERITY_DOT`. Do not introduce new hues — severity dots and the verdict tint
  are the only color this page earns.
- Every string here is constitution-voiced; if a new string is needed, run it
  through the use/never table before shipping.
- Route stays thin (`routes/runs.$runId.tsx`): `component: RunPage`,
  `pendingComponent: RunPageSkeleton`, `head: buildSeo(...)` — unchanged shape.
```
