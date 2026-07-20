# Routes Scope
Rules for `apps/web/src/routes/**`.

`route.tsx` files are THIN: no exported function components, no JSX beyond wiring.
They bind a component, a skeleton, and SEO — nothing else.
- `component` → the page component (client), imported from `#/components/<feature>/`.
- `pendingComponent` → its `*Skeleton`, imported from the sibling
  `<page>-skeleton.tsx` module — NEVER from the page module.
- `head()` → `buildSeo(...)`. Private/dashboard routes use `PRIVATE_ROUTE_HEADERS`.

Never export a component from a route file. Layering:
route.tsx → page component → abstracted UI/layout → tailwind + logic per component.

A route file must not statically import ANYTHING from a page's module graph
except the page component itself (the code splitter splits `component` only).
Skeletons and route-needed helpers (search-param parsers etc.) live in their
own small modules; a static import into the page module drags it — and
everything it imports — into the entry chunk.

New routes are scaffolded ONLY via /add-route.
See `.claude/rules/frontend.md`.
