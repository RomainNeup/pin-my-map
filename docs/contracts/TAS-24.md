# TAS-24 — See users' saved maps

**Epic:** Place-saved  •  **Priority:** Nice  •  **Status:** back-ready
**Branch:** `tas-24-public-map`

Most of the public-map module already exists. TAS-24 polishes the UX so a logged-in user can browse other users' public maps from the discover/following flows.

## Backend

- `GET /public/discover` already exists; ensure it returns `points` and `level` (from gamification) per user — add fields to `PublicMapSummaryDto` if missing.
- `GET /public/slug/:slug/stats` (`@Private`-optional, public-readable) returning `{ savedCount, doneCount, tagCount }` for the public map. Used by the public map page header.
- `GET /public/following` (`@Private`) returning `PublicMapSummaryDto[]` for users the requester follows whose maps are public — used by the new "Following" feed item on the front.

## DTOs

`PublicMapSummaryDto` gains optional `points: number; level: number;`.

`PublicMapStatsDto`: `{ savedCount: number, doneCount: number, tagCount: number }`.

## Frontend (front-public)

- `front/src/routes/u/[slug]/+page.svelte`: stats header (using new `/public/slug/:slug/stats`), gamification level badge, list of public saved places, "Follow" button (when logged-in viewer).
- `front/src/routes/public/[token]/+page.svelte`: similar layout, no follow button (token = unauthenticated share link).
- `front/src/routes/discover/+page.svelte`: each result card shows level badge + saved count. Add a "Following" tab showing `/public/following` results.

## Tests

Backend spec for `/public/following` (only returns public maps; excludes the requester even if self-followed).
