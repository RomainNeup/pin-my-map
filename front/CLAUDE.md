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
    +layout.svelte, +page.svelte
    login/, register/, place/, saved/
  lib/
    api/        # axios clients, one per backend feature (auth, place, savedPlace, tag) + base.ts
    components/ # reusable Svelte components (Map.svelte, MapPoints.svelte, Input, Button, ...)
    store/      # Svelte stores: error, place, tags, user
    stores/     # Svelte stores: mapStore
    utils/      # geolocation helper
    index.ts
```

**Both `store/` and `stores/` exist.** This is historical — before creating a new store, check both directories so you don't duplicate state. Prefer `store/` for new stores (it has more entries) unless touching map state, which lives in `stores/mapStore.ts`.

## API Client Pattern

`lib/api/base.ts` centralises the axios instance pointing at `PUBLIC_API_BASE_URL` and handles auth headers. Per-feature files (`auth.ts`, `place.ts`, `savedPlace.ts`, `tag.ts`) export typed functions that call the backend's REST endpoints (whose contract is visible at `<backend>/api` Swagger in dev). When adding a new backend feature, add a matching file here rather than calling axios inline from components.

## Conventions

- Flat-config ESLint (`eslint.config.js`) + Prettier with `prettier-plugin-svelte` and `prettier-plugin-tailwindcss` (Tailwind classes auto-sorted on format).
- Styling: Tailwind first, `tailwind-merge` when composing conditional classes. Global CSS lives in `src/app.css`.
- Keep components presentational; business state belongs in stores, HTTP in `lib/api/`.
