# TAS-27 — Display places on a list

**Epic:** Place-saved  •  **Priority:** Nice  •  **Status:** front-only
**Branch:** `front/tas-26-27-37-saved`

Polish the saved-places list view in `front/src/routes/saved/list/`.

## Scope

- Each row: name, address (truncated), rating (star count), done badge, tag chips (color from TAS-5 if set), createdAt relative ("3d ago").
- Sort dropdown: newest, oldest, rating-desc, name-asc.
- Empty state when no saved places.
- Loading skeleton while fetching.
- Tap-row → navigate to `/saved/[id]`.
- Pagination: load-more button (limit/offset; chunk size 30). Reset on filter change.

## Files

- `front/src/routes/saved/list/+page.svelte` (or split into a `SavedListItem.svelte` component under `front/src/lib/components/place/`).
- `front/src/lib/api/savedPlace.ts`: ensure list endpoint accepts `{ limit, offset, tagIds }`.

## Out of scope

- Map view, infinite scroll (load-more is enough), drag-to-reorder.
