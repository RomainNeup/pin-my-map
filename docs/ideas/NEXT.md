# Future Ideas — beyond the Notion backlog

Maintained by the `features` agent. Each entry: title, scope, points, dependencies.

## Pass 1 — 2026-04-25

Inventoried 43 Notion tickets (TAS-4 → TAS-46) across 5 epics: Tags-label, Place-general, Place-saved, User, Game. Below are 8 fresh tickets that don't duplicate anything currently in the backlog.

---

### 1. Build a notification system (in-app + email)

- **Epic:** User (new sub-area: Notifications) — or new epic `Notifications` if preferred
- **Scope:**
  - New `notification/` Nest module with `Notification` schema (recipient, type, payload, readAt) and a thin emitter service consumed by `follow`, `place-comment`, `suggestion`, `gamification`.
  - `/notifications` REST endpoints (list, mark-read, mark-all-read) + SSE or polling client store.
  - Bell icon in `shell/` with unread badge; preferences page (per-type opt-in, email digest cadence).
- **Points:** 8
- **Dependencies:** TAS-28 (Follow), TAS-16 (Comment), TAS-46 (Other users suggestion)
- **Why it matters:** the social graph and suggestion features already exist but produce no signal back to users — engagement dies at the write boundary.

---

### 2. Place collections / lists ("Trips", "Wishlist", "Best brunch")

- **Epic:** Place - saved (new concept: Collection)
- **Scope:**
  - `collection/` module: `Collection` (owner, name, description, isPublic, slug, coverPlaceId) with M:N to `SavedPlace`.
  - Collection CRUD + add/remove saved place; list view, public read-only view at `/u/[slug]/c/[collectionSlug]`.
  - Filter chips on the main map to scope by collection.
- **Points:** 8
- **Dependencies:** TAS-14 (Save), TAS-24 (See users saved map)
- **Why it matters:** tags are flat labels; collections give users curated, shareable bundles ("Tokyo 2026", "Coffee in Paris") which is the actual mental model on Mapstr/Google Lists.

---

### 3. Deep-link share for a single place

- **Epic:** Place - saved
- **Scope:**
  - Generate short share URL `/p/[shortId]` with OpenGraph tags (title, address, static Mapbox image, rating).
  - "Share" button on place detail (native share sheet on mobile, copy on desktop).
  - Track share count for gamification (reuse existing action; consider new `place_shared` action +2 pts).
- **Points:** 3
- **Dependencies:** TAS-29 (Display place detail)
- **Why it matters:** organic growth loop — users currently can't paste a place into Whatsapp with a preview.

---

### 4. Block and mute users

- **Epic:** User
- **Scope:**
  - Add `blockedUserIds: ObjectId[]` to user schema. Filter from `discover`, `following`, `suggestion`, `place-comment`, public-map listings.
  - `/users/:id/block` and `/users/:id/mute` endpoints + admin-side audit log entry.
  - UI: action menu on profile pages and on comment authors.
- **Points:** 5
- **Dependencies:** TAS-28 (Follow/Unfollow)
- **Why it matters:** social features without blocking are a moderation liability. Required before opening registration broadly (TAS-20).

---

### 5. Moderation queue dashboard with analytics

- **Epic:** Place - general (admin sub-area)
- **Scope:**
  - Extend `/admin/suggestions` and `/admin/audit` with charts: pending/approved/rejected per week, suggestion lead time, top contributors, top flagged users.
  - Bulk approve/reject actions on suggestions.
  - SLA badge (suggestion older than N days highlighted).
- **Points:** 5
- **Dependencies:** TAS-10 (Approve places add/edit), TAS-46 (Other users suggestion)
- **Why it matters:** as suggestions and place creation scale, admins need throughput tooling — currently it's a flat list.

---

### 6. PWA + offline map tile cache

- **Epic:** new `Platform` epic (or Place - saved)
- **Scope:**
  - Add `@vite-pwa/sveltekit` with service worker; cache app shell, API GETs (saved places, tags, profile) with stale-while-revalidate.
  - Mapbox offline tile cache for currently-viewed bounding box (Mapbox GL `setStyle` + IndexedDB), bounded to ~50 MB.
  - "Available offline" indicator + manifest/install prompt.
- **Points:** 8
- **Dependencies:** TAS-22 (Display places on a map)
- **Why it matters:** the app is most useful while traveling, often with poor connectivity. SPA + adapter-static makes this a small step.

---

### 7. GDPR account export + delete-everything

- **Epic:** User
- **Scope:**
  - `/users/me/export` returns a zip: profile JSON, saved places, tags, comments, suggestions, gamification log.
  - `/users/me` DELETE: hard-delete user, cascade delete `saved`, `tag`, `place-comment`, `follow`, `suggestion`, `gamification` rows; anonymize `place` ownership for places the user authored (keep canonical place, null `createdBy`).
  - Confirmation flow with password re-entry; audit log entry; 7-day soft-delete grace period flag on user.
- **Points:** 5
- **Dependencies:** none (touches most modules but no blocking ticket)
- **Why it matters:** legal requirement before any public launch in EU; also good hygiene for the dev/admin (`audit` already exists, fits the pattern).

---

### 8. Photo uploads on saved places

- **Epic:** Place - saved
- **Scope:**
  - Multipart upload endpoint on `saved/`; store originals in S3-compatible bucket (or local volume in dev), generate thumbnail with `sharp`.
  - `Photo` sub-document on `SavedPlace` (url, thumbUrl, width, height, takenAt). Up to N per saved place.
  - Lightbox component on place detail; first photo used as map popup thumbnail and OG image (fits with #3).
- **Points:** 8
- **Dependencies:** TAS-29 (Display place detail), TAS-31 (Place details enhancement)
- **Why it matters:** Mapstr's stickiness comes from personal photos attached to memories — currently users have ratings + comments but nothing visual.

---

## Cross-cutting notes

- Items #1, #2, #3, #8 each warrant a dedicated `GamificationAction` (`notification_subscribed` is not user-facing; `collection_create`, `place_shared`, `photo_upload` are). Keep payouts in the 2–5 pt range to match `gamification.service.ts` scale.
- #4 and #5 should ship before any push to widen TAS-20 (open registration), otherwise moderation will be reactive only.
- #6 (PWA) and #7 (GDPR) are platform hygiene — schedule them between feature waves rather than blocking on them.
