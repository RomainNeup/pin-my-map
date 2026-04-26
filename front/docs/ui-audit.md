# UI Coherence Audit — pin-my-map frontend

_Generated: 2026-04-25_

---

## 1. Inventory

All 53 Svelte component files under `src/lib/components/`:

| File | Sub-folder | Imported by (call sites) |
|------|-----------|--------------------------|
| `Button.svelte` | root | ~15 files across routes + components |
| `EmojiPicker.svelte` | root | `profile/MyTagsSection` |
| `Input.svelte` | root | ~12 files |
| `Loader.svelte` | root | auth layout |
| `Map.svelte` | root | routes/+page, place/[id], place/pick, place/create, public/[token] |
| `MapGeolocation.svelte` | root | routes/+page |
| `MapPoints.svelte` | root | routes/+page |
| `StarRating.svelte` | root | saved/[id], profile/MySavedSection |
| `StaticMapThumb.svelte` | root | profile/MySavedSection, public/PublicMapView |
| `TagPicker.svelte` | root | saved/[id] |
| `Toggle.svelte` | root | (not imported — dead code) |
| `map/PlaceSheet.svelte` | map | routes/+page |
| `map/SearchBar.svelte` | map | routes/+page |
| `map/TagFilterChips.svelte` | map | routes/+page |
| `place/EditPlaceDialog.svelte` | place | place/[id], saved/[id] |
| `place/EnrichmentDetails.svelte` | place | **NOBODY** — dead code |
| `place/OpenInMenu.svelte` | place | saved/[id] |
| `place/PlaceEnrichmentDetails.svelte` | place | place/[id] |
| `place/PlacePhotoCarousel.svelte` | place | PlaceEnrichmentDetails |
| `place/SavedTagFilter.svelte` | place | profile/MySavedSection |
| `place/SuggestEditDialog.svelte` | place | place/[id] |
| `place/TagChip.svelte` | place | map/PlaceSheet, saved/[id], public/PublicMapView |
| `profile/DangerZone.svelte` | profile | routes/profile |
| `profile/FollowingSection.svelte` | profile | routes/profile |
| `profile/IdentityCard.svelte` | profile | routes/profile |
| `profile/MySavedSection.svelte` | profile | routes/profile |
| `profile/MyTagsSection.svelte` | profile | routes/profile |
| `profile/PublicMapSection.svelte` | profile | routes/profile |
| `profile/StatsSummary.svelte` | profile | routes/profile |
| `public/CommentSection.svelte` | public | public/PublicMapView |
| `public/FollowButton.svelte` | public | public/PublicMapView |
| `public/PublicMapView.svelte` | public | routes/u/[slug], routes/public/[token] |
| `shell/AppHeader.svelte` | shell | routes/+layout |
| `shell/AppShell.svelte` | shell | routes/+layout |
| `shell/BottomNav.svelte` | shell | routes/+layout |
| `shell/UserMenu.svelte` | shell | shell/AppHeader |
| `ui/Avatar.svelte` | ui | profile/FollowingSection, user/UserSearch, public/PublicMapView |
| `ui/Chip.svelte` | ui | profile/MySavedSection, map/TagFilterChips |
| `ui/ConfirmDialog.svelte` | ui | routes/+layout (global confirm store) |
| `ui/Dialog.svelte` | ui | ~8 files |
| `ui/DoneFilter.svelte` | ui | profile/MySavedSection |
| `ui/EmptyState.svelte` | ui | routes/+page, place/search, profile/MySavedSection, profile/MyTagsSection |
| `ui/Fab.svelte` | ui | routes/+page |
| `ui/Field.svelte` | ui | several forms |
| `ui/FormLabel.svelte` | ui | several forms |
| `ui/IconButton.svelte` | ui | shell/AppHeader, place/[id] |
| `ui/Popover.svelte` | ui | place/[id] |
| `ui/Sheet.svelte` | ui | map/PlaceSheet |
| `ui/Skeleton.svelte` | ui | profile/IdentityCard |
| `ui/SkeletonCard.svelte` | ui | profile/MySavedSection |
| `ui/Toast.svelte` | ui | routes/+layout (global) |
| `user/FollowButton.svelte` | user | **NOBODY** — dead code |
| `user/UserSearch.svelte` | user | routes/discover |

---

## 2. Duplicates

### 2a. FollowButton — two variants, one unused

| File | API | Used by |
|------|-----|---------|
| `user/FollowButton.svelte` | `{ userId }` → compact button only | **Nobody** |
| `public/FollowButton.svelte` | `{ userId }` → button + follower count + "isMe" stat line | `public/PublicMapView` |

The `user/` variant was likely the first version; `public/` is the current superset used at every call site. `user/FollowButton` is **dead code**.

**Fix:** Remove `user/FollowButton.svelte` (no imports to update). The `public/` variant already covers the compact case via conditional rendering (it hides when `stats` is null).

### 2b. EnrichmentDetails — two components, old one unused

| File | Used by |
|------|---------|
| `place/EnrichmentDetails.svelte` | **Nobody** |
| `place/PlaceEnrichmentDetails.svelte` | `place/[id]` |

`PlaceEnrichmentDetails` is the richer successor (photo carousel, amenity chips, social links, reservation links, "permanently closed" banner). The old `EnrichmentDetails` is dead code.

**Fix:** Remove `place/EnrichmentDetails.svelte`.

### 2c. Toggle.svelte — unused

`Toggle.svelte` is not imported anywhere. It may predate the `DoneFilter` component.

**Fix:** Remove it (dead code).

---

## 3. Style drift

### 3a. Hand-rolled `<button>` elements used as action buttons

Admin conflicts page (`routes/admin/conflicts/+page.svelte`) has three raw `<button>` elements styled with bespoke Tailwind instead of `<Button>`:
- "Apply selected" — `bg-orange-500 px-3 py-1 text-xs …`
- "Dismiss" — `border border-border px-3 py-1 text-xs …`
- Pagination "Previous" / "Next" — `border border-border px-3 py-1 …`

These use custom orange colors not in the design token system and miss disabled/loading states.

**Fix:** Replace with `<Button>` component.

### 3b. Hardcoded non-token colors in conflicts page

`bg-orange-100 / text-orange-700 / bg-orange-50 / border-orange-200 / text-orange-900 / bg-orange-500 / hover:bg-orange-600 / border-red-200 / bg-red-50 / text-red-700`

The rest of the app uses `bg-danger-soft`, `text-danger`, `bg-accent-soft`, `text-accent`, etc. The conflicts page was clearly added quickly without design system alignment.

**Fix:** Map orange → warning-adjacent using `bg-bg-muted / text-fg-muted` for neutral conflict cards and `text-danger` / `bg-danger-soft` for error blocks; replace orange action buttons with `<Button tone="neutral">`.

### 3c. `bg-surface` / `hover:bg-surface-muted` — missing tokens

Conflicts page uses `bg-surface` and `hover:bg-surface-muted` which don't exist in the CSS variable set (the correct tokens are `bg-bg-elevated` and `hover:bg-bg-muted`).

**Fix:** Replace in conflicts page.

### 3d. Inline empty-state patterns (not using `<EmptyState>`)

The following locations output a paragraph with `text-fg-muted` instead of using the shared `<EmptyState>` component:

| File | Text |
|------|------|
| `routes/admin/users/+page.svelte` | "No users." |
| `routes/admin/suggestions/+page.svelte` | "No {status} suggestions." / "No pending places." |
| `routes/discover/+page.svelte` | "No public maps found…" / "No public maps from people you follow yet." |
| `routes/profile/+page.svelte` (suggestions tab) | "You haven't submitted any suggestions yet." |
| `profile/FollowingSection.svelte` | "You aren't following anyone yet." / "No one follows you yet." |
| `routes/admin/conflicts/+page.svelte` | "No conflicts to review." |

`EmptyState` already exists and is used in 4 places. These 6 locations are inconsistent.

**Fix (high-value):** The admin pages have very low traffic; for high signal/cost ratio, convert the user-facing ones: `discover` (2 spots) and `profile/FollowingSection` (1 spot). Leave the raw admin table "No users." text-only since it's deliberately compact inside a data-table context.

### 3e. Tab-switcher pattern — inconsistent

Three different tab-switcher implementations co-exist:
1. `profile/+page.svelte` — `bg-accent text-accent-fg` active, full `<div>` pill bar
2. `admin/suggestions/+page.svelte` — `border-accent text-accent` active, rounded-full pills
3. `admin/users/+page.svelte` — same as suggestions
4. `discover/+page.svelte` — `bg-accent text-white` (hardcodes `text-white` instead of `text-accent-fg`)
5. `profile/FollowingSection.svelte` — `bg-accent text-accent-fg` active, no hover on inactive

Minor drift; not worth a full extraction (the pattern is simple and context-specific), but the `text-white` hardcode in `discover` should be `text-accent-fg` for dark-mode correctness.

**Fix:** Change `text-white` → `text-accent-fg` in `discover/+page.svelte` tab buttons.

### 3f. Form labels — partially using FormLabel/Field

Some forms use `<FormLabel>` + `<Field>`, others use raw `<label class="…">`. This is a low-impact inconsistency as the visual result is identical. Left as-is.

---

## 4. Recommendations (priority order)

1. **[Done]** Remove dead components: `user/FollowButton.svelte`, `place/EnrichmentDetails.svelte`, `Toggle.svelte`.
2. **[Done]** Fix `admin/conflicts/+page.svelte`: replace hand-rolled buttons with `<Button>`, fix non-token colors, fix `bg-surface`/`surface-muted` tokens.
3. **[Done]** Fix `discover/+page.svelte`: replace inline empty states with `<EmptyState>`, fix `text-white` → `text-accent-fg` in tab buttons.
4. **[Done]** Fix `profile/FollowingSection.svelte`: replace inline empty state with `<EmptyState>`.
5. **Leave alone:** `admin/users/+page.svelte` "No users." — compact inline text appropriate for a data-admin table.
6. **Leave alone:** `admin/suggestions/+page.svelte` "No {status} suggestions." — dynamic text with interpolation; extracting to `<EmptyState>` would require extra props with no visual gain.
7. **Leave alone:** `profile/+page.svelte` suggestions tab — one-liner, low traffic.
8. **Leave alone:** Form label inconsistency — visual result identical, refactor risk outweighs benefit.
9. **Leave alone:** Tab-switcher component extraction — pattern is too context-specific, creates coupling.
