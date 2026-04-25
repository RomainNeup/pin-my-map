# Pin My Map

Pin My Map is the easiest way to create your own personal map, filled with your favorite places in every city around the world.

- 🎯 Save addresses you love.
- 🗂️ Organise them by tags.
- ✅ Track places you've already visited.
- ✨ Plan the spots you want to check out next.
- 🌍 Share your map publicly via a slug or unguessable token.
- 👥 Follow other users and discover their picks.
- 🏆 Earn points and achievements as you build your map.

Accessible anywhere. Ultra-fast. 100% Open Source.

## Tech Stack

- **Frontend** — SvelteKit 2 + Svelte 5, Tailwind CSS, Mapbox GL JS, axios. Built as a static SPA via `@sveltejs/adapter-static` (no SSR at runtime).
- **Backend** — NestJS 10 (TypeScript), Mongoose, JWT auth, Swagger/OpenAPI.
- **Database** — MongoDB.
- **Optional integrations** — Google Places API (place enrichment), Mapbox Geocoding.

## Repository Layout

```
pin-my-map/
├── front/                # SvelteKit SPA — dev server on :5173
│   └── src/
│       ├── routes/       # pages (map, place, saved, public, admin, ...)
│       └── lib/
│           ├── api/      # axios clients, one per backend feature
│           ├── components/
│           ├── stores/   # Svelte stores
│           └── utils/
├── back/                 # NestJS API — listens on :8080
│   └── src/
│       ├── auth/         # JWT, AuthGuard, @Private() / @Admin() decorators
│       ├── user/         # users, roles, public-map config
│       ├── place/        # canonical places (shared)
│       ├── saved/        # SavedPlace (per user, references Place)
│       ├── tag/          # user-scoped tags
│       ├── place-comment/# public comments on places
│       ├── suggestion/   # user-submitted place corrections
│       ├── follow/       # social graph
│       ├── public-map/   # public read-only views by slug/token + discover feed
│       ├── gamification/ # points, levels, achievements
│       ├── audit/        # admin audit log
│       ├── import/       # Mapstr archive import
│       ├── enrichment/   # pluggable place-enrichment providers (Google Places)
│       └── mcp/          # Model Context Protocol endpoint for AI agents
└── docker-compose.yml    # mongo + backend (8080) + frontend (5173)
```

See [`CLAUDE.md`](CLAUDE.md), [`back/CLAUDE.md`](back/CLAUDE.md), and [`front/CLAUDE.md`](front/CLAUDE.md) for in-depth architectural notes.

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn (Classic, v1)
- MongoDB (local or remote)
- A [Mapbox](https://www.mapbox.com/) access token
- _(optional)_ A [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service) key for place enrichment

### 1. Configure environment

Copy the example env files and fill them in:

```bash
cp back/.env.example back/.env
cp front/.env.example front/.env
```

**`back/.env`**

| Variable | Default | Description |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://localhost/pin-my-map` | Mongo connection string |
| `JWT_SECRET` | `secret` (dev only) | JWT signing secret |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed origins |
| `NODE_ENV` | — | Set to `development` to expose Swagger UI at `/api` |
| `GOOGLE_PLACES_API_KEY` | — | Optional. Enables Google Places enrichment; place creation works without it. |

> Note: the server is hard-coded to listen on `:8080` in `back/src/main.ts`.

**`front/.env`**

| Variable | Description |
| --- | --- |
| `PUBLIC_API_BASE_URL` | Backend origin, e.g. `http://localhost:8080` |
| `PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox GL JS access token |

### 2. Run with Docker (recommended)

```bash
docker-compose up -d
```

This starts:
- `mongodb` on `:27017` (with a persistent `mongodb_data` volume)
- `backend` on `:8080` (live-reload, source mounted from `./back`)
- `frontend` on `:5173` (live-reload, source mounted from `./front`)

Open http://localhost:5173. Swagger UI is at http://localhost:8080/api.

### 2. Run locally without Docker

```bash
# Backend
cd back
yarn install
yarn start:dev          # http://localhost:8080  (Swagger UI: /api in dev)

# Frontend (separate terminal)
cd front
yarn install
yarn start:dev          # http://localhost:5173
```

You'll need a MongoDB instance reachable at `MONGODB_URI`.

## Common Commands

### Backend (`cd back`)

| Command | What it does |
| --- | --- |
| `yarn start:dev` | Watch-mode Nest server |
| `yarn start:prod` | Run compiled `dist/main` |
| `yarn build` | `nest build` |
| `yarn lint` | ESLint with `--fix` |
| `yarn test` / `yarn test:watch` / `yarn test:cov` | Jest unit tests |
| `yarn test:e2e` | Jest with `test/jest-e2e.json` |

Run a single test: `yarn test -- src/place/place.service.spec.ts` or `yarn test -- -t "test name"`.

### Frontend (`cd front`)

| Command | What it does |
| --- | --- |
| `yarn start:dev` | Vite dev server (note: the script is `start:dev`, not `dev`) |
| `yarn build` / `yarn preview` | Production build / preview |
| `yarn check` | `svelte-kit sync` + `svelte-check` (type check) |
| `yarn lint` | `prettier --check` + `eslint` |
| `yarn format` | `prettier --write` |

No frontend test runner is configured.

## Architecture Highlights

### Authentication

Auth is JWT-based and enforced **globally by opt-in**, not opt-out. `AuthGuard` is registered as `APP_GUARD` and only verifies the JWT on routes marked with `@Private()` or `@Admin()` (from `back/src/auth/auth.decorator.ts`). Inside handlers the current user is read via the `@User()` param decorator. See [`back/CLAUDE.md`](back/CLAUDE.md) for details.

### Domain model

- A **`Place`** is a canonical location (lat/lng, address) shared across all users.
- A **`SavedPlace`** is the per-user record that references a `Place` and carries the user's rating, comment, done flag, and tags.
- A **`Tag`** is user-scoped and applied to saved places.
- **Public maps** are exposed by either a human-friendly `slug` or an unguessable `token`, with a `discover` feed of public maps for browsing.

### Gamification

User actions (`save`, `done`, `rate`, `comment`, `tag`, `place_create`, `suggestion`, `follow`, `comment_public`) award points and progress through achievements defined in `back/src/gamification/achievements.catalog.ts`. New features should consider whether they produce a meaningful action worth rewarding — see the gamification section in [`CLAUDE.md`](CLAUDE.md) for guidelines.

### MCP endpoint

The backend exposes a [Model Context Protocol](https://modelcontextprotocol.io/) endpoint under `/mcp` so AI agents can read/write the user's map with the same auth model as the rest of the API.

## API Documentation

Swagger UI is available at `http://localhost:8080/api` when the backend is running with `NODE_ENV=development`. Swagger/OpenAPI is the source of truth for the HTTP contract — every DTO and controller is annotated with `@nestjs/swagger` decorators.

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make changes, keeping commits scoped and descriptive.
3. Run lint and tests in the affected project (`yarn lint`, `yarn test`).
4. Open a pull request.

## License

MIT — see [`LICENSE.md`](LICENSE.md).
