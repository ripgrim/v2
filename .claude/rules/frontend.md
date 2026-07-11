---
description: Frontend conventions — thin route.tsx pattern, component organization, TanStack Query rules, useEffect policy, SEO. Load when working in apps/web.
paths:
  - "apps/web/**"
  - "packages/ui/**"
---

# Frontend conventions (§9)

## Route composition — `route.tsx` is THIN
No exported function components, no JSX beyond wiring. A route binds three
things and nothing else:
- `component` → the page component (client), from `#/components/<feature>/`.
- `pendingComponent` → the page's sibling `*Skeleton`.
- `head()` → `buildSeo({ path, title, description, type })`.

```tsx
export const Route = createFileRoute("/_app/users/$username")({
  component: UserProfilePage,
  pendingComponent: UserProfilePageSkeleton,
  head: ({ params, match }) =>
    buildSeo({
      path: match.pathname,
      title: formatPageTitle(`@${params.username}`),
      description: `GitHub profile and Tripwire contributor score for @${params.username}.`,
      type: "profile",
    }),
})
```

Layering: **route.tsx → page component (client) → abstracted UI/layout
components → tailwind + logic per component.** Every page component ships a
sibling `*Skeleton` used as `pendingComponent`. Every route calls `buildSeo` in
`head()`. Private/dashboard routes use `PRIVATE_ROUTE_HEADERS` (noindex).
New routes are scaffolded ONLY via `/add-route`.

## Component organization — `components/<feature>/<part>`
`home/`, `events/`, `runs/`, `rules/`, `workflows/editor/`, `moderation/`,
`layout/`. Primitives live in `@tripwire/ui`; custom app UI lives here. Extract
when 50+ lines, used in 2+ files, or owns state; keep inline when <10 lines,
single-use, presentational.

## Data conventions
- Server state is **TanStack Query fed by server functions calling
  `@tripwire/db` services**. Never `useState` + `fetch`. NO internal REST.
- Hierarchical query-key factories per domain
  (`all → lists() → list(x) → details() → detail(id)`).
- Explicit `staleTime` on every query; forward `signal`; `keepPreviousData` only
  on variable-key queries; targeted invalidation; `onSettled` (not `onSuccess`)
  for optimistic reconciliation.
- The SSE stream merges into the Query cache — the live event list is a cache
  update, not a parallel state system.

## Runtime caveat (web head)
Server code in `apps/web` (server functions, start.ts middleware) executes on
**Node** (the nitro runtime), NOT Bun. No `Bun.*` globals anywhere in
`apps/web` or in packages it imports at runtime; shared utils must stay
portable (`generateId`'s Bun-fast-path + Node-fallback is the precedent).

## useEffect policy
Keep it down. Server sync → a query. Derived state → `useMemo`. Stable callback
deps → refs. Audited by `/you-might-not-need-an-effect` and friends via
`/cleanup`; Query usage audited by `/react-query-best-practices`.
