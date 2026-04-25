# TAS-31 — Place details enhancement

**Epic:** Place-saved  •  **Priority:** Nice  •  **Status:** back-ready
**Branch:** `tas-30-31-place-edit-details`

## Goal

Surface richer enrichment data on the place detail page. Backend is mostly done (`PlaceEnrichmentDto`). This ticket fills the remaining gaps.

## Backend

- Ensure `PlaceDto.enrichment` is populated on `GET /place/:id` (verify it is — currently the field exists; confirm controller/mapper return it).
- Add a derived `summary` field on `PlaceDto` (string, optional) built by the mapper from `enrichment`: e.g. `"$$ • 4.6 ★ (1.2k) • Open now"`. Keep the formatter pure and unit-tested.
- Compute `priceLevel` text mapping ('$', '$$', '$$$', '$$$$') in the front, not back.

```ts
export class PlaceDto {
  // existing fields ...
  summary?: string; // human-readable one-liner
}
```

## Frontend (front-place)

- `front/src/routes/place/[id]/+page.svelte`: add sections for opening hours, phone (tel:), website (target=_blank), price level dots, top 3 reviews (collapsible), photo carousel (use existing `getPhoto(id, idx)` proxy endpoint).
- Reuse `front/src/lib/utils/mapDeeplinks.ts` for "Open in Maps" link.
- Components in `front/src/lib/components/place/`: `PlaceEnrichmentDetails.svelte` (new), `PlacePhotoCarousel.svelte` (new).

## Tests

Backend: mapper spec for `summary` formatting (rating only, price only, both, none).
