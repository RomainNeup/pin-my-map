# TAS-4 — Create tag (finish)

**Epic:** Tags  •  **Priority:** Must  •  **Status:** back-ready
**Branch:** `tas-4-5-tag-colors` (shared with TAS-5)

## Goal

Tag CRUD already exists in `back/src/tag/`. Verify completeness; ensure:

- Create returns 409 on duplicate `name` for the same owner (currently relies on uniqueness — confirm and add explicit check + Swagger 409 response).
- Update is idempotent and refuses duplicate name.
- Service awards `GamificationAction = 'tag'` on **first** tag creation per user only (use `gamificationService.award(userId, 'tag')` in try/catch after the write). Do not re-award on every create.

## Routes (no change to paths)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST   | /tag | @Private | 201, body CreateTagRequestDto |
| GET    | /tag | @Private | 200, list owner's tags |
| PUT    | /tag/:id | @Private | 200 |
| DELETE | /tag/:id | @Private | 204 |

## DTO changes

See TAS-5.md (color additions go there). For TAS-4, no shape change — just validation polish.

## Tests

Add `tag.service.spec.ts` covering: duplicate name 409, gamification awarded once.

## Frontend

No front change for TAS-4 alone.
