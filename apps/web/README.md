# modkit

**Triage your community without the noise.**

A fast, design-first moderation dashboard for GitHub organizations. modkit pulls
every flagged issue, pull request, and comment into a single triage queue —
severity-ranked, reason-tagged, and one keystroke away from resolution — so
maintainers spend their time on signal, not spam.

> This is an **artifact build**: the screens are fully functional against a
> seeded, in-repo dataset. Two pages ship — the **moderation queue** (`/`) and
> **Automod** (`/automod`) — and you can navigate between them from the topbar.
> Auth, settings, and the rest of the platform are intentionally out of scope.

## Stack

- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) (file-based routing, SSR)
- [TanStack Query](https://tanstack.com/query) for data fetching and optimistic cache updates
- [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com) (OKLch design tokens, surface elevation layers)
- [Radix UI](https://www.radix-ui.com) primitives, shadcn-style components, [lucide-react](https://lucide.dev) icons
- [motion](https://motion.dev) for the side-panel transition, [@number-flow/react](https://number-flow.barvian.me) for animated stats
- [next-themes](https://github.com/pacocoursey/next-themes) light/dark, [sonner](https://sonner.emilkowal.ski) toasts
- [Biome](https://biomejs.dev) (via [Ultracite](https://ultracite.dev)) for lint/format, strict TypeScript

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

```bash
pnpm check-types  # tsc --noEmit
pnpm check        # biome check
pnpm build        # production build
```

## How it works

- `src/lib/mock-data.ts` seeds ~14 realistic flagged items (spam, harassment,
  off-topic, automod, NSFW) across well-known repos.
- `src/lib/moderation.functions.ts` exposes them through TanStack Start server
  functions; `moderation.query.ts` wraps those in `queryOptions` factories that
  the route loader prefetches.
- The triage queue (`components/moderation/queue-list.tsx`) filters by reason and
  sorts by severity or recency. Each row opens an animated detail panel
  (`dashboard-side-panel.tsx`) on `xl` screens; hovering a row reveals a compact
  approve / remove / ban toolbar.
- **Approve / Remove / Ban** run an optimistic mutation
  (`lib/use-moderation-actions.ts`) that drops the item from the cached queue and
  fires a toast — no backend round-trip required.
- **Automod** (`routes/automod.tsx`) lists detection rules with category, pattern,
  scope, a 7-day match sparkline, and false-positive rate. Toggling a rule or
  resolving a match (`lib/use-automod-actions.ts`) optimistically rewrites the
  cached rules; the detail panel reads live from that same cache.

## Layout

```
src/
├── routes/            # __root.tsx + index.tsx (the dashboard)
├── components/
│   ├── layouts/       # topbar, dashboard shell, side panel
│   ├── moderation/    # stats, queue, rows, detail, actions
│   └── ui/            # shadcn-style primitives
├── hooks/             # use-has-mounted, use-media-query
└── lib/               # types, mock data, query/server-fn layer, config maps
```
