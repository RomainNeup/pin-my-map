# CLAUDE.md — back/

Guidance for Claude Code when working inside the NestJS backend.

## Commands

- `yarn start:dev` — watch-mode server on `:8080`
- `yarn start:prod` — runs compiled `dist/main`
- `yarn build` — `nest build`
- `yarn lint` — ESLint `--fix` over `{src,apps,libs,test}/**/*.ts`
- `yarn test` — Jest (config inline in `package.json`; `rootDir: src`, matches `*.spec.ts`)
- `yarn test:cov` / `yarn test:watch`
- `yarn test:e2e` — uses `test/jest-e2e.json`
- Single test: `yarn test -- src/place/place.service.spec.ts` or `-t "should ..."`

## Environment

Loaded via `dotenv.config()` in `src/main.ts`:
- `MONGODB_URI` — falls back to `mongodb://localhost/pin-my-map`
- `JWT_SECRET` — falls back to `"secret"` (do not rely on this outside dev)
- `PORT` — read but note `main.ts` hard-codes `app.listen(8080)`
- `CORS_ALLOWED_ORIGINS` — comma-separated; default `http://localhost:5173`
- `NODE_ENV=development` — enables Swagger UI at `/api`
- `GOOGLE_PLACES_API_KEY` — optional. Enables `enrichment/providers/google-places.provider.ts`; place creation still succeeds when unset (enrichment is silently skipped).

See `back/.env.example` for the canonical list.

## Module Architecture

`AppModule` wires `MongooseModule.forRoot(MONGODB_URI)` once, then imports the feature modules listed below. `UserModule` is imported by `AuthModule` and owns the user schema.

Core domain modules:
- `AuthModule` — JWT issuance/verification, global guard, decorators.
- `UserModule` — user schema (`role: 'user' | 'admin'`, optional `publicSlug` / `publicToken` / `isPublic`).
- `PlaceModule` — canonical `Place` (location, address). Shared across users.
- `SavedPlaceModule` — `SavedPlace`: per-user record referencing a `Place` with rating, comment, done flag, tags.
- `TagModule` — user-scoped tags.

Layered feature modules:
- `ImportModule` — bulk import (Mapstr archive via multipart upload).
- `EnrichmentModule` — pluggable place-enrichment providers (Google Places).
- `SuggestionModule` — user-submitted edit/correction suggestions on places.
- `PlaceCommentModule` — public comments on places (distinct from the private `comment` on `SavedPlace`).
- `FollowModule` — follow/unfollow users, followers/following lists.
- `PublicMapModule` — public read-only views of a user's map (`/public/slug/:slug`, `/public/token/:token`, `/public/discover`).
- `GamificationModule` — points/levels/achievements; see root CLAUDE.md.
- `AuditModule` — admin audit log of sensitive actions.
- `McpModule` — Model Context Protocol endpoint exposing the API to AI agents.

Each feature follows a fixed file layout — **mirror this when adding a feature**:

```
<feature>/
  <feature>.module.ts       # @Module, registers schema via MongooseModule.forFeature
  <feature>.controller.ts   # HTTP endpoints, Swagger-annotated
  <feature>.service.ts      # business logic, injects Mongoose Model
  <feature>.entity.ts       # @Schema() Mongoose class
  <feature>.dto.ts          # request/response DTOs with @ApiProperty
  <feature>.mapper.ts       # entity <-> DTO conversion (keep DTOs free of Mongoose types)
```

Controllers stay thin; services own persistence; mappers own DTO shape. DTOs must stay Swagger-annotated — `/api` is the source of truth for the HTTP contract.

## Authentication Pattern

Auth is enforced **globally by opt-in**, not opt-out:

- `AuthGuard` is registered as `APP_GUARD` in `AuthModule`, so it runs on every request.
- By default the guard returns `true`. It only verifies the JWT when the handler/class is marked with `@Private()` or `@Admin()` (from `auth/auth.decorator.ts`), which set `isPrivate` / `isAdmin` metadata and add `@ApiBearerAuth` + 401/403 responses to Swagger.
- On success the guard attaches the JWT payload to `request.user` (`{ sub, email, name, role, ... }`).
- `@Admin()` additionally requires `request.user.role === 'admin'` (returns 403 otherwise).
- To protect a route: decorate the controller or method with `@Private()` (or `@Admin()`). Read the current user inside a handler via the `@User()` param decorator from `user/user.decorator.ts` — pass a key (`@User('sub') userId: string`) or get the whole payload (`@User() user`).

JWT is signed with `JWT_SECRET`, `expiresIn: 1h`, via `@nestjs/jwt`'s `JwtModule.register` in `AuthModule`.

## Conventions

- TypeScript, ESLint + Prettier (see `.eslintrc.js` / `.prettierrc` if present).
- Swagger decorators are required on new DTOs/endpoints — don't break `/api`.
- Use `MongooseModule.forFeature([{ name, schema }])` in the feature module; inject via `@InjectModel`.
- When introducing a new frontend origin (deploy preview, etc.), update `CORS_ALLOWED_ORIGINS`.
