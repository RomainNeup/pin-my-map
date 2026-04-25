# TAS-26 — Filter on tags

**Epic:** Place-saved  •  **Priority:** Should  •  **Status:** front-only
**Branch:** `front/tas-26-27-37-saved`

Backend already supports `?tagIds=a,b,c` on `GET /saved`. This ticket polishes the UI so that a user can filter their saved list (and the map?) by one or more tags.

## Front scope

- `front/src/routes/saved/list/+page.svelte`: row of tag chips above the list. Clicking toggles selection (multi-select). Selected chips drive the API call's `tagIds`.
- "Clear filters" button when any chip is active.
- Persist selected tag IDs in URL search params (`?tagIds=...`) so refresh keeps state.
- Reuse `front/src/lib/stores/tags.ts` to load tags.
- Show a small "(N)" badge on each chip with the count of saved places carrying that tag (count derived locally from current page; OK to be approximate).

## Out of scope

- Map filtering by tag (separate ticket).
- AND vs OR semantics — backend is OR; reflect that.
