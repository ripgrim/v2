# Routes Scope
Rules for `apps/web/src/routes/**`.

`route.tsx` files are THIN: no exported function components, no JSX beyond wiring.
They bind a component, a skeleton, and SEO — nothing else.
- `component` → the page component (client), imported from `#/components/<feature>/`.
- `pendingComponent` → its sibling `*Skeleton`.
- `head()` → `buildSeo(...)`. Private/dashboard routes use `PRIVATE_ROUTE_HEADERS`.

Never export a component from a route file. Layering:
route.tsx → page component → abstracted UI/layout → tailwind + logic per component.

New routes are scaffolded ONLY via /add-route.
See `.claude/rules/frontend.md`.
