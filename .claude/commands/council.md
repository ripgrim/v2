---
description: Spawn ~10 task agents to dig into an area from different angles, synthesize their findings, then plan. For "how does X actually work now" questions before a big change.
argument-hint: <area>
---

Convene a council on `$ARGUMENTS`. Use this before big changes, to answer "how
does X actually work now" from many angles at once.

1. Decompose `$ARGUMENTS` into ~10 distinct investigation angles — e.g. data
   flow, the relevant contracts, db services + schema, the worker pipeline, the
   forge adapter surface, the rules/executor path, the UI surface, tests +
   fixtures, the spec sections that govern it, and the cut-list boundaries around
   it.
2. Spawn one Explore/general-purpose task agent per angle IN PARALLEL (single
   message, multiple agents). Each returns findings + file:line evidence, not a
   file dump.
3. **Synthesize** into one map: how it works today, where the seams and
   invariants are, what the spec mandates, what's risky or surprising, and any
   contradictions between angles.
4. **Plan**: propose the change as concrete steps that respect the §3 arrows, the
   anti-BS block, and the current build step. Flag anything that would touch the
   cut list. Do not start editing — this command ends at a reviewed plan.
