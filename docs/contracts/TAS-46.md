# TAS-46 — Other users' suggestion (my suggestions list)

**Epic:** Place-saved  •  **Priority:** Bonus  •  **Status:** back-ready
**Branch:** `tas-10-46-suggestions`

## Goal

Let a logged-in user list their own suggestions and their statuses (so they see "Pending / Approved / Rejected with reason"). Also expose suggestions on a place to all viewers as a count + (when admin or own) full list.

## Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET    | /suggestion/mine | @Private | 200 SuggestionDto[] — submitter == user, newest first |
| GET    | /suggestion/place/:placeId/count | @Private | 200 `{ pending: number, total: number }` |

Existing admin routes unchanged.

## Service

`SuggestionService.listMine(userId)` — query by submitter.
`SuggestionService.countForPlace(placeId)` — aggregate pending + total.

## Frontend

- `front/src/routes/profile/+page.svelte` (or new tab): "My suggestions" list.
- `front/src/lib/api/suggestion.ts`: `listMine()`, `countForPlace(placeId)`.
- `front/src/routes/place/[id]/+page.svelte`: small chip "N suggestions pending" that links to admin queue if admin, otherwise read-only.

## Tests

Service spec for `listMine` (only own), `countForPlace`.
