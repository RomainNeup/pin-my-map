# TAS-20 — Configure member management

**Epic:** User  •  **Priority:** Bonus  •  **Status:** back-ready
**Branch:** `tas-18-19-20-25-34-user-admin`

## Goal

A single admin-tunable setting `registrationMode` controls who can register: `open` (anyone), `approval-required` (anyone, but flagged pending until admin approves — see TAS-18), `invite-only` (registration endpoint disabled; only admin invite flow).

## Storage

New tiny `config/` module (do not call it `settings/` to avoid collision with the front public-map settings):

```
back/src/config/
  config.module.ts
  config.controller.ts   # @Admin GET /config, @Admin PUT /config
  config.service.ts
  config.entity.ts       # AppConfig schema, single doc keyed `key: 'app'`
  config.dto.ts
```

`AppConfig` schema:

```ts
@Schema()
class AppConfig {
  @Prop({ required: true, unique: true }) key: 'app';
  @Prop({ required: true, default: 'open', enum: ['open', 'approval-required', 'invite-only'] })
  registrationMode: 'open' | 'approval-required' | 'invite-only';
}
```

Service exposes `get(): Promise<AppConfig>` (auto-creates default doc if missing) and `update(partial)`.

## Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET    | /config | @Admin | returns current AppConfig |
| PUT    | /config | @Admin | body Partial<AppConfig>, audit `config.update` |

`AuthService.register` consults `ConfigService.get()`:
- `open` → user `status: 'active'` (current behavior).
- `approval-required` → user `status: 'pending'`.
- `invite-only` → 403 with explicit message.

## Public read

There is one public endpoint needed: the front `/register` page should know whether registration is even open. Add `GET /config/public` (no auth) returning only `{ registrationMode }` so the UI can disable the register form when `invite-only`.

## Audit

`config.update` with before/after.

## Frontend (front-admin-users)

- `/admin/users/+page.svelte`: small "Settings" card at top with `registrationMode` selector. Save → audit toast.
