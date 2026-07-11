---
description: Run verdict replay over event history with the working-tree engine, diff verdicts vs stored runs, and output the flip report for human review.
argument-hint: [range]
---

Run a verdict replay over event history using the **working-tree** core engine,
then produce the flip report. This is the CI gate on `core` changes
(`.claude/rules/testing.md`) and a research pipeline.

`[range]` scopes the event window (e.g. a date range, repo, or `last:1000`);
default to a sensible recent window and state what you chose.

Steps:
1. Select the events in `[range]` from the append-only event store (raw payloads
   are the replay corpus — never mutate them).
2. Re-run `apps/worker/src/jobs/replay.ts` semantics: rebuild each `RuleContext`
   and walk the DAG with the CURRENT engine, WITHOUT executing any forge actions.
3. Diff each replayed verdict against the stored run's verdict.
4. Output the **flip report**: for every changed verdict, the run link, the rule
   + version responsible, and old → new verdict. Group by rule.
5. Do NOT auto-accept flips — this is for human review. Summarize magnitude
   (how many flipped, which rules dominate) and stop.
