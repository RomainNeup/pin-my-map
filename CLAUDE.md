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
- No test runner is configured in `front/package.json` despite what the README says.

Full stack via Docker: `docker-compose up -d` from repo root (mongo + backend on 8080 + frontend on 5173, both with live-mounted source).

## Environment

Backend (`back/.env`): `MONGODB_URI`, `JWT_SECRET`, `PORT` (defaults 8080 in `main.ts`), `CORS_ALLOWED_ORIGINS` (comma-separated; defaults to `http://localhost:5173`), `NODE_ENV` (Swagger UI at `/api` only when `development`).

Frontend (`front/.env`): `PUBLIC_MAPBOX_ACCESS_TOKEN`, `PUBLIC_API_BASE_URL`.

## Backend Architecture

`src/app.module.ts` wires four feature modules under a single `MongooseModule.forRoot`: `auth`, `place`, `tag`, `saved`. Each feature module follows the same convention:

```
<feature>/
  <feature>.module.ts       # Nest module
  <feature>.controller.ts   # HTTP layer
  <feature>.service.ts      # business logic
  <feature>.entity.ts       # Mongoose schema
  <feature>.dto.ts          # request/response DTOs (Swagger-annotated)
  <feature>.mapper.ts       # entity <-> DTO conversion
```

Domain model: `Place` represents a location; `SavedPlace` is the per-user record that references a place (with rating, comment, done flag, tags). `Tag` is user-scoped. `Auth` handles JWT issuance/verification — guards and the current-user decorator live in `auth/auth.guard.ts` and `auth/auth.decorator.ts` and are the canonical way to protect routes and access the authenticated user.

When adding a feature, mirror this file layout and keep controllers thin — services own persistence, mappers own DTO shape.

## Frontend Architecture

Routes under `src/routes/`: `/` (map view), `/login`, `/register`, `/place`, `/saved`.

`src/lib/` is split by concern:
- `api/` — axios-based clients, one per backend feature, reading `PUBLIC_API_BASE_URL`.
- `components/` — reusable Svelte components.
- `store/` and `stores/` — Svelte stores for app state. Both directories exist historically; check both before adding new state.
- `utils/` — shared helpers.

Map integration uses `mapbox-gl` directly (not a wrapper). Because SvelteKit is configured with `adapter-static`, there is **no server-side rendering at runtime** — all API calls happen client-side.

## Conventions

- Backend uses ESLint + Prettier (`back/.eslintrc.js`). Frontend uses flat-config ESLint (`front/eslint.config.js`) + Prettier with `prettier-plugin-svelte` and `prettier-plugin-tailwindcss`.
- Swagger/OpenAPI is the source of truth for the HTTP contract — annotate new DTOs and controllers with `@nestjs/swagger` decorators so `/api` stays accurate.
- CORS origins must be added to `CORS_ALLOWED_ORIGINS` when introducing a new frontend host.
