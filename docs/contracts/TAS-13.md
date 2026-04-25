# TAS-13 — Import from Google Maps

**Epic:** Place-saved  •  **Priority:** Should  •  **Status:** draft
**Branch:** `tas-11-13-import`

## Goal

User uploads a Google Takeout export (a JSON file from "Saved Places.json" or similar) and the backend creates Places + SavedPlaces for them, mirroring the existing Mapstr flow.

## Route

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /import/google | @Private | multipart/form-data, field `file`, max 10 MB, returns ImportSummaryDto |

## Input shape

Google Takeout "Saved places" lists come in two formats; support both:

1. **GeoJSON FeatureCollection** (newer Takeout): each feature has `geometry.coordinates: [lng, lat]` and `properties: { 'Title' | 'name', 'Google Maps URL', address?, note? }`.
2. **JSON array of saved-place items** (legacy): `[ { title, location: { latitude, longitude, address? }, note? } ]`.

Detect by inspecting the parsed JSON; throw `BadRequestException` with a clear message when neither matches.

## Behavior

For each valid entry:
- `Place.findOrCreate` by `(lat, lng, name)` (within ~25m tolerance — reuse the existing dedupe helper if Mapstr import has one; otherwise, exact match on the rounded coords).
- New places get `moderationStatus: 'pending'` (per Wave 1 TAS-10) — admin can approve later. `createdBy = userId`. Do NOT call enrichment automatically (rate-limit risk on bulk).
- `SavedPlace.findOrCreate` for `(userId, placeId)` with `comment` from Google's note.
- Award `place_create` once per **newly-created Place** and `save` once per **newly-created SavedPlace** (mirrors Mapstr behavior).

## Service

`ImportService.importGoogle(userId, parsedJson): Promise<ImportSummaryDto>` returning counts: `placesCreated`, `savedCreated`, `skipped`, plus errors[].

## Audit

Single `import.google` audit row with `{ placesCreated, savedCreated, skipped }`.

## Tests

Backend spec covering both input shapes, dedupe of existing places, error accumulation, gamification award counts.

## Frontend (front-import)

- `front/src/routes/import/+page.svelte`: tab "Google Maps" alongside Mapstr; file picker; submit → POST /import/google; show ImportSummary.
- `front/src/lib/api/import.ts`: `importGoogle(file)`.
