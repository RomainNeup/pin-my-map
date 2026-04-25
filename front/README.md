# Pin My Map — Frontend

SvelteKit 2 + Svelte 5 SPA for [Pin My Map](../README.md). Tailwind CSS, Mapbox GL JS, axios. Built with `@sveltejs/adapter-static` — there is **no SSR at runtime**, all data fetching happens client-side against the backend.

> For day-to-day project context (route map, store layout, conventions) read [`CLAUDE.md`](CLAUDE.md).

## Setup

```bash
cp .env.example .env   # then fill in values
yarn install
yarn start:dev         # http://localhost:5173
```

> The npm script is `start:dev`, **not** `dev`.

Required runtime: Node.js 18+, Yarn (Classic). The backend must be reachable at `PUBLIC_API_BASE_URL`.

## Environment

See [`.env.example`](.env.example). Both variables must be `PUBLIC_`-prefixed so SvelteKit exposes them to client code.

| Variable                     | Description                                  |
| ---------------------------- | -------------------------------------------- |
| `PUBLIC_API_BASE_URL`        | Backend origin, e.g. `http://localhost:8080` |
| `PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox GL JS access token                    |

## Commands

| Command                       | Description                                                                |
| ----------------------------- | -------------------------------------------------------------------------- |
| `yarn start:dev`              | Vite dev server on `:5173`                                                 |
| `yarn build` / `yarn preview` | Production build / local preview                                           |
| `yarn check`                  | `svelte-kit sync` + `svelte-check` (type check; use this instead of `tsc`) |
| `yarn lint`                   | `prettier --check .` + `eslint .`                                          |
| `yarn format`                 | `prettier --write .`                                                       |

No test runner is configured.

## Source Layout

```
src/
  routes/             # pages
    +layout.svelte, +page.svelte    (main map view)
    login/, register/
    place/[id]/, place/{create,pick,search}/
    saved/list/, saved/[id]/
    tags/list/, import/
    profile/, settings/public-map/
    discover/, following/
    u/[slug]/                        (public profile by slug)
    public/[token]/                  (public map by share token)
    admin/{audit,suggestions,users}/
  lib/
    api/        # axios clients, one per backend feature + base.ts
    components/ # reusable Svelte components (map/, place/, public/, shell/, ui/)
    stores/     # Svelte stores (user, place, tags, mapStore, theme, toast, confirm, gamification)
    utils/      # geolocation, clickOutside, focusTrap, portal, mapboxStatic, mapDeeplinks
```

The HTTP contract is visible at `<backend>/api` (Swagger) when running the backend in development.

## Docker

The frontend is part of the root `docker-compose.yml`. From the repo root:

```bash
docker-compose up -d
```
