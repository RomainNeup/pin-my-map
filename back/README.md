# Pin My Map — Backend

NestJS 10 + Mongoose API for [Pin My Map](../README.md). Listens on `:8080`. JWT-based auth. Swagger UI exposed at `/api` in development.

> For day-to-day project context (architecture, auth pattern, conventions) read [`CLAUDE.md`](CLAUDE.md).

## Setup

```bash
cp .env.example .env   # then fill in values
yarn install
yarn start:dev         # http://localhost:8080
```

Required runtime: Node.js 18+, Yarn (Classic), a reachable MongoDB instance.

## Environment

See [`.env.example`](.env.example). Loaded via `dotenv.config()` in `src/main.ts`.

| Variable | Default | Notes |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://localhost/pin-my-map` | Mongo connection string |
| `JWT_SECRET` | `secret` | Dev-only fallback — override in any non-dev env |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated list |
| `NODE_ENV` | — | Must be `development` to expose Swagger UI at `/api` |
| `GOOGLE_PLACES_API_KEY` | — | Optional; enables Google Places enrichment when set |

> The server is hard-coded to listen on `:8080` in `src/main.ts` regardless of `PORT`.

## Commands

| Command | Description |
| --- | --- |
| `yarn start:dev` | Watch-mode Nest server |
| `yarn start:prod` | Runs compiled `dist/main` |
| `yarn build` | `nest build` |
| `yarn lint` | ESLint with `--fix` |
| `yarn test` | Jest unit tests (`*.spec.ts` under `src/`) |
| `yarn test:watch` / `yarn test:cov` | Watch / coverage |
| `yarn test:e2e` | Uses `test/jest-e2e.json` |

Single test: `yarn test -- src/place/place.service.spec.ts` or `yarn test -- -t "should ..."`.

## Module Layout

`src/app.module.ts` registers a single `MongooseModule.forRoot` and the feature modules. Each follows the same convention:

```
<feature>/
  <feature>.module.ts       # @Module, registers schema via MongooseModule.forFeature
  <feature>.controller.ts   # HTTP layer, Swagger-annotated
  <feature>.service.ts      # business logic, injects Mongoose Model
  <feature>.entity.ts       # @Schema() Mongoose class
  <feature>.dto.ts          # request/response DTOs with @ApiProperty
  <feature>.mapper.ts       # entity <-> DTO conversion
```

Modules:

- **Core** — `auth`, `user`, `place`, `saved` (`SavedPlace`), `tag`
- **Social & sharing** — `follow`, `public-map`, `place-comment`, `suggestion`
- **Engagement** — `gamification`, `audit`
- **Integrations** — `import` (Mapstr), `enrichment` (Google Places), `mcp` (Model Context Protocol)

See [`CLAUDE.md`](CLAUDE.md) for the auth pattern (`@Private()`, `@Admin()`, `@User()`), conventions, and per-module notes.

## API Documentation

With `NODE_ENV=development`, Swagger UI is at <http://localhost:8080/api>. The Swagger doc is built from `@nestjs/swagger` decorators on controllers and DTOs — keep them up to date when changing the HTTP contract.

## Docker

The backend is part of the root `docker-compose.yml`. From the repo root:

```bash
docker-compose up -d backend mongodb
```
