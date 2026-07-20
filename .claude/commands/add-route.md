---
description: Scaffold the §9 route pattern — thin route.tsx (component + pendingComponent + buildSeo head), page component + sibling Skeleton, query hooks with a key factory.
argument-hint: <path>
---

Scaffold a route at `$ARGUMENTS` in `apps/web` following the §9 pattern
(`.claude/rules/frontend.md`). This is the ONLY sanctioned way to add a route.

Steps:
1. Create a **thin** `route.tsx` under `apps/web/src/routes/` for `$ARGUMENTS`:
   binds `component`, `pendingComponent`, and `head: () => buildSeo(...)` only.
   **Never export a component from a route file.** No JSX beyond wiring.
   Private/dashboard routes use `PRIVATE_ROUTE_HEADERS` (noindex).
2. Create the page component under `apps/web/src/components/<feature>/` and its
   `*Skeleton` in a SEPARATE sibling file `<page>-skeleton.tsx`, named
   PascalCase, files kebab-case. The Skeleton is the `pendingComponent`. The
   route imports the skeleton from the `-skeleton` module, never from the page
   module — TanStack's splitter splits `component` only, and a static route →
   page-module import defeats route code splitting (§9, DECISIONS 2026-07-19).
   If the page renders skeleton bits, the page imports FROM the skeleton file,
   never the reverse.
3. If the page needs server data, add query hooks with a hierarchical key factory
   (`all → lists() → list(x) → details() → detail(id)`), explicit `staleTime`,
   forwarded `signal`, fed by a server function calling `@tripwire/db` services.
   Never `useState` + `fetch`.
4. Wire `buildSeo({ path, title: formatPageTitle(...), description, type })` in
   `head()`. Reuse `#/lib/seo` + `#/lib/site-config`.
5. Keep `useEffect` out; prefer queries and `useMemo`.
6. Typecheck (`bun --filter @tripwire/web typecheck`) and report. Remind the user
   to run `/ui-review` on the new components.
