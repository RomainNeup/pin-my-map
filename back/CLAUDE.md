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

## Module Architecture

`AppModule` wires `MongooseModule.forRoot(MONGODB_URI)` once, then imports four feature modules: `AuthModule`, `PlaceModule`, `TagModule`, `SavedPlaceModule`. There is also a `UserModule` (imported by `AuthModule`) that owns the user schema.

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
- By default the guard returns `true`. It only checks the JWT when the handler/class is marked with the `@Private()` decorator (from `auth/auth.decorator.ts`), which sets the `isPrivate` metadata and adds `@ApiBearerAuth` + 401 response to Swagger.
- On success the guard attaches the JWT payload to `request.user`.
- To protect a route: decorate the controller or method with `@Private()`. To access the current user inside a handler, read it off the request.

JWT is signed with `JWT_SECRET`, `expiresIn: 1h`, via `@nestjs/jwt`'s `JwtModule.register` in `AuthModule`.

## Conventions

- TypeScript, ESLint + Prettier (see `.eslintrc.js` / `.prettierrc` if present).
- Swagger decorators are required on new DTOs/endpoints — don't break `/api`.
- Use `MongooseModule.forFeature([{ name, schema }])` in the feature module; inject via `@InjectModel`.
- When introducing a new frontend origin (deploy preview, etc.), update `CORS_ALLOWED_ORIGINS`.
