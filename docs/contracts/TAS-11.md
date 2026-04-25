# TAS-11 — Bulk import places

**Epic:** Place-general  •  **Priority:** Nice  •  **Status:** back-ready
**Branch:** `tas-11-13-import`

## Goal

Admins can bulk-create canonical `Place` documents from a CSV upload (admin-only — distinct from the per-user Mapstr/Google saved-place import).

## Route

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /import/places-csv | @Admin | multipart/form-data, field `file`, max 10 MB, returns ImportSummaryDto |

## CSV format

Header row required. Columns (case-insensitive):
- `name` (required)
- `lat` (required, -90..90)
- `lng` (required, -180..180)
- `address` (required)
- `description` (optional, defaults to `''`)
- `image` (optional URL)

Skip empty rows. Invalid rows accumulated in `ImportSummaryDto.errors[]` with `{ row, message }`. Continue processing the rest.

Created places get `moderationStatus: 'approved'` (admin upload) and `createdBy = adminId`.

## Service

`ImportService.importPlacesCsv(adminId, csvBuffer): Promise<ImportSummaryDto>`. Use `csv-parse/sync` (already-popular small dep) or hand-roll RFC 4180 parsing — pick whichever already exists in `back/node_modules`; if neither, add `csv-parse` (~250 KB).

## Audit

Single `place.bulk_import` audit row per upload with `{ created: N, errors: M }` in meta.

## Frontend (front-import)

- `front/src/routes/import/+page.svelte`: add a "Bulk places (admin)" tab visible only to admins. File picker + Import button → POST. Show summary on response (created count, error rows table).
