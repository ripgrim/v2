---
description: The AI review agent — inversion keeps core pure, bounded tool loop over the ForgeAdapter read surface, structured output as the muzzle, trace persistence, prompt versioning. Load when working on ai-review or the worker's generate() injection.
paths:
  - "packages/core/src/rules/ai-review/**"
  - "apps/worker/**"
---

# Review agent (§8, locked)

- **Runtime: AI SDK (`ai`)**, called from the **worker**, inside rule
  `ai-review@1`. Provider-agnostic — model is a config string (Anthropic first).
  No eve, no Chat SDK, no LangChain.
- **Inversion keeps core pure:** `evaluate` receives an injected `generate()` fn
  and pre-fetched context. **Core never imports the AI SDK or the adapter.**
- **Bounded tool loop, not an open agent:** tools are thin wrappers over the
  `ForgeAdapter` read surface (`getDiff`, `readFile`, `getCommits`,
  `getContributorContext`) — never `@github-tools/sdk` or any GitHub SDK (that
  reintroduces coupling through the back door). Hard cap ~10–15 steps + token
  budget. Diff provided up front so trivial PRs resolve in one step, zero tool
  calls.
- **Output is structured, never prose** — the schema is the muzzle:
  ```ts
  // contracts/review.ts
  { verdict: 'pass' | 'block' | 'needs_review',
    confidence: number,          // 0–1
    summary: string,             // ONE sentence, hard length limit
    findings: Finding[] }        // max 5: { severity, file, line?, note }
  ```
  The presenter physically cannot write an essay; findings render on the run page.
- Result is a normal `RuleResult` envelope ⇒ composes in workflows, snapshots
  into runs, replays in the verdict-diff pipeline like every other rule.
- `instructions.md` + `template.md` are **versioned WITH the rule** — material
  prompt change ⇒ `ai-review@2`. Prompts are code; runs must stay interpretable.
- Every invocation's full trace (messages, tool calls, tokens, cost) persists in
  the run step's evidence: it answers "show me why" on appeal and accrues the
  labeled-ish dataset for the (cut-listed) ML layer.
- Port the review process (instructions, format, tool flow) from
  `~/tripwire-eve-demo`. The eve runtime stays behind.
