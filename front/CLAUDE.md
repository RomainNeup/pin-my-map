# CLAUDE.md — front/

Guidance for Claude Code when working inside the SvelteKit frontend.

## Commands

- `yarn start:dev` — Vite dev server on `:5173` (the npm script is `start:dev`, **not** `dev` — the root README is misleading)
- `yarn build` / `yarn preview`
- `yarn check` — `svelte-kit sync` + `svelte-check` (type check; run this instead of `tsc`)
- `yarn lint` — `prettier --check .` + `eslint .`
- `yarn format` — `prettier --write .`
- No test runner is configured.

## Environment

- `PUBLIC_MAPBOX_ACCESS_TOKEN` — Mapbox GL token
- `PUBLIC_API_BASE_URL` — backend origin (e.g. `http://localhost:8080`)

Both must be `PUBLIC_`-prefixed to be exposed to client code by SvelteKit.

## Build Target

Uses `@sveltejs/adapter-static` with `fallback: 'index.html'` → the app is a pure client-rendered SPA. Consequences:

- **No SSR at runtime.** Never write logic that assumes Node globals in `+page.ts` / `+layout.ts`, and don't rely on server-side `load` data being fresh per request — it's baked in at build time.
- All data fetching happens client-side against `PUBLIC_API_BASE_URL` via the axios clients in `src/lib/api/`.
- Guard any code touching `window`, `document`, or `mapbox-gl` with `onMount` or a `browser` check — SvelteKit still prerenders routes at build time.

## Stack

Svelte 5 + SvelteKit 2, Tailwind 3 (with `@tailwindcss/forms`), `mapbox-gl` used directly (no wrapper lib), `axios` for HTTP, `tailwind-merge` for class composition.

## Source Layout

```
src/
  routes/
    +layout.svelte, +page.svelte         # main map view
    login/, register/                    # auth
    place/[id]/, place/{create,pick,search}/
    saved/list/, saved/[id]/
    tags/list/
    import/                              # Mapstr/CSV import
    profile/, settings/public-map/
    discover/, following/                # social feeds
    u/[slug]/                            # public profile by slug
    public/[token]/                      # public map by share token
    admin/{audit,suggestions,users}/     # admin console (gated by user.role === 'admin')
  lib/
    api/        # axios clients, one per backend feature + base.ts (see below)
    components/ # reusable Svelte components, with subfolders map/, place/, public/, shell/, ui/
    stores/     # Svelte stores: user, place, tags, mapStore, theme, toast, confirm, gamification
    utils/      # geolocation, clickOutside, focusTrap, portal, mapboxStatic, mapDeeplinks
    index.ts
```

A `store/` directory existed historically; everything has been consolidated into `stores/`. If you find references to `lib/store/...` they're stale.

## API Client Pattern

`lib/api/base.ts` centralises the axios instance pointing at `PUBLIC_API_BASE_URL` and handles auth headers. Per-feature files mirror the backend modules: `auth`, `place`, `savedPlace`, `tag`, `user`, `import`, `suggestion`, `placeComment`, `follow`, `publicMap`, `gamification`, `audit`, plus `mapbox` for direct Mapbox API calls. The HTTP contract is visible at `<backend>/api` (Swagger) in dev. When adding a new backend feature, add a matching file here rather than calling axios inline from components.

## Conventions

- Flat-config ESLint (`eslint.config.js`) + Prettier with `prettier-plugin-svelte` and `prettier-plugin-tailwindcss` (Tailwind classes auto-sorted on format).
- Styling: Tailwind first, `tailwind-merge` when composing conditional classes. Global CSS lives in `src/app.css`.
- Keep components presentational; business state belongs in stores, HTTP in `lib/api/`.
