# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Monorepo with two independent Yarn projects:

- `back/` — NestJS 10 + Mongoose API (TypeScript), listens on `:8080`. See [`back/CLAUDE.md`](back/CLAUDE.md) for backend-specific guidance.
- `front/` — SvelteKit 2 + Svelte 5 + Tailwind + Mapbox GL (TypeScript), dev server on `:5173`. Built with `adapter-static` (pure SPA / static hosting, `index.html` fallback). See [`front/CLAUDE.md`](front/CLAUDE.md) for frontend-specific guidance.

**When working inside `back/` or `front/`, read that subdirectory's `CLAUDE.md` first** — it has the module/route conventions, auth pattern, and store layout you'll need.

MongoDB is the datastore. Auth is JWT-based. Frontend talks to backend via `PUBLIC_API_BASE_URL`.

## Common Commands

Backend (`cd back`):
- `yarn start:dev` — watch-mode Nest server
- `yarn start:prod` — run compiled `dist/main`
- `yarn build` — `nest build`
- `yarn lint` — ESLint with `--fix`
- `yarn test` / `yarn test:watch` / `yarn test:cov` — Jest unit tests (config inline in `package.json`, `rootDir: src`, `*.spec.ts`)
- `yarn test:e2e` — Jest with `test/jest-e2e.json`
- Run a single test: `yarn test -- path/to/file.spec.ts` or `yarn test -- -t "test name"`

Frontend (`cd front`):
- `yarn start:dev` — Vite dev server (note: script is `start:dev`, not `dev` as the README implies)
- `yarn build` / `yarn preview`
- `yarn check` — `svelte-kit sync` + `svelte-check` (type check)
- `yarn lint` — `prettier --check` + `eslint`
- `yarn format` — `prettier --write`
- No test runner is configured in `front/package.json`.

Full stack via Docker: `docker-compose up -d` from repo root (mongo + backend on 8080 + frontend on 5173, both with live-mounted source). See `docker-compose.yml` for the canonical service definitions.

## Environment

Backend (`back/.env`, see `back/.env.example`):
- `MONGODB_URI` — defaults to `mongodb://localhost/pin-my-map`
- `JWT_SECRET` — defaults to `"secret"` (dev-only fallback)
- `PORT` — read but `main.ts` hard-codes `app.listen(8080)`
- `CORS_ALLOWED_ORIGINS` — comma-separated; defaults to `http://localhost:5173`
- `NODE_ENV` — Swagger UI exposed at `/api` only when `development`
- `GOOGLE_PLACES_API_KEY` — optional. Enables the Google Places enrichment provider; place creation still works when unset (enrichment is silently skipped).

Frontend (`front/.env`, see `front/.env.example`):
- `PUBLIC_API_BASE_URL` — backend origin (e.g. `http://localhost:8080`)
- `PUBLIC_MAPBOX_ACCESS_TOKEN` — Mapbox GL JS token

## Backend Architecture

`src/app.module.ts` wires a single `MongooseModule.forRoot` and the feature modules below. Each follows the same `<feature>.{module,controller,service,entity,dto,mapper}.ts` convention (mappers may be omitted when there's no entity, e.g. `enrichment`/`mcp`).

Core domain:
- `auth/` — JWT issuance/verification. Owns `AuthGuard` (registered globally as `APP_GUARD`), the `@Private()` / `@Admin()` decorators, and the `@User()` param decorator. See `back/CLAUDE.md` for the opt-in auth pattern.
- `user/` — user schema (`role: 'user' | 'admin'`, optional `publicSlug` / `publicToken` / `isPublic`). Imported by `AuthModule`.
- `place/` — canonical place entities (location, address). Shared across users.
- `saved/` — `SavedPlace`: per-user record referencing a `Place` (rating, comment, done flag, tags).
- `tag/` — user-scoped tags applied to saved places.

Feature modules layered on top:
- `import/` — bulk import (e.g. Mapstr archive upload via `multipart/form-data`).
- `enrichment/` — pluggable place-enrichment providers (currently `providers/google-places.provider.ts`); used during place creation when `GOOGLE_PLACES_API_KEY` is set.
- `suggestion/` — user-submitted edit/correction suggestions on places.
- `place-comment/` — public comments left on places (separate from the per-user private `comment` on `SavedPlace`).
- `follow/` — social graph: follow/unfollow users, list followers/following.
- `public-map/` — public read-only views of a user's map by `slug` or `token`, plus a `discover` feed.
- `gamification/` — points, levels, achievements driven by `GamificationAction`s. Catalog in `achievements.catalog.ts`, scoring in `gamification.service.ts`.
- `audit/` — admin-only audit log of sensitive actions.
- `mcp/` — Model Context Protocol HTTP endpoint exposing the API to AI agents.

When adding a feature, mirror the file layout, register schemas with `MongooseModule.forFeature`, keep controllers thin (services own persistence, mappers own DTO shape), and annotate DTOs/handlers with `@nestjs/swagger` so `/api` stays accurate.

## Frontend Architecture

Routes under `src/routes/`:
- `/` — main map view; `/login`, `/register` — auth
- `/place/[id]`, `/place/{create,pick,search}` — place detail & creation flow
- `/saved/list`, `/saved/[id]` — saved places list & detail
- `/tags/list`, `/import`, `/profile`, `/settings/public-map`
- `/discover`, `/following` — social feeds
- `/u/[slug]`, `/u/[slug]/place/...` — public profile by slug
- `/public/[token]` — public map by share token
- `/admin/{audit,suggestions,users}` — admin console (gated by user role)

`src/lib/` is split by concern:
- `api/` — axios-based clients, one per backend feature (`auth`, `place`, `savedPlace`, `tag`, `user`, `import`, `suggestion`, `placeComment`, `follow`, `publicMap`, `gamification`, `audit`, `mapbox`) plus `base.ts`, all reading `PUBLIC_API_BASE_URL`.
- `components/` — reusable Svelte components, with subfolders `map/`, `place/`, `public/`, `shell/`, `ui/`.
- `stores/` — Svelte stores: `user`, `place`, `tags`, `mapStore`, `theme`, `toast`, `confirm`, `gamification`. (Historical note: a `store/` directory once existed; everything now lives in `stores/`.)
- `utils/` — shared helpers (`geolocation`, `clickOutside`, `focusTrap`, `portal`, `mapboxStatic`, `mapDeeplinks`).

Map integration uses `mapbox-gl` directly (not a wrapper). Because SvelteKit is configured with `adapter-static`, there is **no server-side rendering at runtime** — all API calls happen client-side.

## Conventions

- Backend uses ESLint + Prettier (`back/.eslintrc.js`). Frontend uses flat-config ESLint (`front/eslint.config.js`) + Prettier with `prettier-plugin-svelte` and `prettier-plugin-tailwindcss`.
- Swagger/OpenAPI is the source of truth for the HTTP contract — annotate new DTOs and controllers with `@nestjs/swagger` decorators so `/api` stays accurate.
- CORS origins must be added to `CORS_ALLOWED_ORIGINS` when introducing a new frontend host.

## Gamification

The app has a gamification system (`back/src/gamification/`) with points, levels, and achievements driven by user actions (save, done, rate, comment, tag, place_create, suggestion, follow, comment_public). For **every new feature**, think about how it ties into gamification, but stay practical:

- Ask: does this feature naturally produce a meaningful user action worth rewarding (something the user does, not something automatic)? If yes, add a `GamificationAction` and award points; if no, skip it — not every feature needs a hook.
- If you add a hook, prefer reusing existing actions over inventing new ones. Add a new achievement only when there is a clear progression worth celebrating.
- Keep payouts modest and consistent with the existing scale in `gamification.service.ts` so no single feature dominates the economy.
- Award once per unique action (e.g. per saved place, per follow target) — never on repeat edits — and update `backfillIfNeeded` so existing data stays consistent.
- Never let gamification leak into other features' core logic: award from the feature's service after the primary write succeeds, behind a try/catch if it could fail, so it never blocks the main flow.
