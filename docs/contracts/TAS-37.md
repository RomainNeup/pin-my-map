# TAS-37 — Export saved places to CSV

**Epic:** Place-saved  •  **Priority:** Bonus  •  **Status:** back-ready
**Branch:** `tas-37-csv-export`

## Route

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET    | /saved/export.csv | @Private | 200 text/csv; streams |

## Response

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="pin-my-map-saved-{YYYY-MM-DD}.csv"`
- Header row: `id,name,address,lat,lng,rating,done,comment,tags,createdAt`
- Tags column: comma-free — join with `|` and wrap each cell in quotes when it contains `,`, `"`, or newlines (RFC 4180 escape: double the `"`).
- One row per saved place for `userId`, sorted by `createdAt` desc.

## Service

In `SavedPlaceService` add `exportCsv(userId: string): Promise<string>` (or stream via `Readable`). Streaming preferred for large maps; sync string fine for v1.

## Auth + audit

`@Private()` only — not admin-loggable.

## Gamification

None.

## Frontend

- `front/src/lib/api/savedPlace.ts`: `exportCsv(): Promise<Blob>` (axios `responseType: 'blob'`).
- `front/src/routes/saved/list/+page.svelte`: button "Export CSV" → triggers download via `URL.createObjectURL`.

## Tests

Backend: spec covers escaping (a comment containing `,` and `"`), tag join, empty list returns header only.
