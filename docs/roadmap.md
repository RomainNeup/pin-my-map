# pin-my-map — Product Roadmap

_Last updated: 2026-04-25. Living document; revisit quarterly._

---

## 1. One-Line Vision

In two years, pin-my-map is the personal travel memory layer people reach for instinctively — not just to bookmark places, but to relive journeys, plan future ones collaboratively, and discover where curious people like them actually go.

---

## 2. Strategic Pillars

**Pillar 1 — Memory, not bookmarks.**
A saved place should feel like a page in a travel journal: photos, private notes, the date you were there, the mood, the people. The current save + rate + comment model is the skeleton; flesh it out until place cards feel personal.

**Pillar 2 — Journeys over lists.**
Individual pins only make sense when they are strung together in time and space. The product must make it trivially easy to see "everything I did in Lisbon in March" or to plan next month's Barcelona trip as an ordered itinerary.

**Pillar 3 — Honest social, not performative.**
Unlike Instagram or Google Maps, the audience for a pin-my-map map is yourself first, trusted friends second, the public third. Features should reinforce that hierarchy: granular privacy, a friend-first feed, reactions over likes.

**Pillar 4 — Frictionless capture.**
The biggest competitor is not another app — it is the user's camera roll plus a voice note. Every import path (screenshot OCR, browser extension, Google Maps Takeout, Mapstr archive) that removes friction creates a habit. Dedup and enrichment quality determine whether imported data is useful or noise.

**Pillar 5 — Playful, not gamified for the sake of it.**
The existing points/achievements system (`back/src/gamification/`) is the foundation. Build on it only when it produces a genuine "nice, I didn't realise that" moment — streaks, country counters, journey stats. Resist synthetic mechanics that feel like dark patterns.

---

## 3. Themes

### 3.1 Photos & Memories

**Rationale.** Mapstr's stickiness comes from a photo tied to the moment of a visit. Pinterest boards work because they are visually scannable. Right now a saved place (`back/src/saved/`) carries a rating and a text comment but nothing visual. Adding personal photos turns the map from a to-do list into a memory archive. This idea was seeded in `docs/ideas/NEXT.md` (item #8); this theme expands it into a full visual experience.

**Inspiration.** Mapstr (photo-first place cards), Pinterest (visual grid browsing), Foursquare/Swarm (check-in photo flow).

---

**Ticket: User-uploaded photos on saved places**
- Multipart upload endpoint on `POST /saved/:id/photos`; store originals in S3-compatible storage, generate WebP thumbnails with `sharp`; `Photo` sub-document on `SavedPlace` (url, thumbUrl, takenAt, caption).
- Up to 10 photos per saved place; first photo becomes the map popup thumbnail and the OG image for share links.
- Gamification: new `photo_upload` action, 3 pts, once per saved place.
- Size: M | Depends on: `SavedPlaceModule`, S3 bucket config | Why: core memory feature.

**Ticket: Lightbox carousel on place detail**
- Full-screen lightbox in `place/[id]/` with swipe/keyboard navigation; shows user photos first, then enrichment photos from `GET /place/:id/photo/:idx`.
- "Add photo" shortcut from within the lightbox.
- Size: S | Depends on: photo upload ticket | Why: photos without a viewer are useless.

**Ticket: "Memory mode" — date-stamped visit log**
- Allow saving multiple visit dates per saved place (array of `visitedAt` timestamps alongside existing `done` flag).
- Timeline tab on place detail listing all visits; summary card shows "visited 3 times, last in April 2025".
- Size: M | Depends on: `SavedPlaceModule` schema | Why: differentiates from simple bookmarking; supports journey timelines (Theme 3.3).

**Ticket: Photo grid on public map profile**
- Public profile at `/u/[slug]` gains an optional "Photos" tab, a masonry grid of the user's place photos (only from public saved places).
- Served through `public-map` controller; no new auth surface needed.
- Size: S | Depends on: photo upload, `PublicMapModule` | Why: makes public profiles visually rich.

**Ticket: OG image generation for share links**
- When a place share URL is opened (`/p/[shortId]`, see Theme 3.8), generate an OG image on the fly: static Mapbox tile + place name + first user photo if available.
- Use a serverless-compatible image composition approach (e.g. `@vercel/og` pattern or a Nest endpoint streaming a composed PNG).
- Size: M | Depends on: share link ticket | Why: WhatsApp/Twitter previews drive viral discovery.

---

### 3.2 Native Social Loop

**Rationale.** The follow graph (`back/src/follow/`) and public maps (`back/src/public-map/`) exist but produce no ongoing signal. Letterboxd's stickiness comes from a chronological friend feed — you see what films people watched this week. Foursquare kept users coming back with a "what are your friends doing now" widget. A friend activity feed closes the retention loop that follow currently leaves open.

**Inspiration.** Letterboxd (activity feed, reactions), Foursquare/Swarm (friend check-ins), Strava (social timeline on a map).

---

**Ticket: Friend activity feed**
- New `feed/` Nest module (or extend `PublicMapModule`). `GET /feed` returns a reverse-chronological stream of public actions from followed users: new saves, done-marks, new public comments, new collections (Theme 3.6).
- Paginated, cursor-based (use `createdAt` as cursor). Frontend route `/following` currently lists maps; add a tab for the activity feed.
- Size: M | Depends on: `FollowModule`, `PublicMapModule` | Why: first feature that gives the social graph a reason to matter daily.

**Ticket: Reactions on public place activity**
- Simple reaction bar (thumbs-up, fire, want-to-go — three fixed types, no custom) on feed items and on `PlaceComment` (`back/src/place-comment/`).
- `reaction/` sub-document on `PlaceComment`; or a lightweight `Reaction` collection keyed by (targetType, targetId, userId, type).
- Size: S | Depends on: friend activity feed | Why: lowest-friction social acknowledgement; avoids comment inflation.

**Ticket: Weekly recap notification**
- Scheduled job (NestJS `@Cron`) building a weekly digest per user: N places saved, M friends active, top place in their area this week.
- Delivered via the notification system from `docs/ideas/NEXT.md` item #1; also as an in-app summary card pinned to the feed.
- Size: M | Depends on: notification system (NEXT.md #1), feed | Why: habit formation; re-engages dormant users.

**Ticket: "Want to go" signal on public places**
- One-tap "want to go" button on a public saved place detail (`/u/[slug]/place/[id]`). Saves a lightweight intent record (userId, placeId) distinct from actually saving the place.
- Aggregated count shown on the place card. Tapping "want to go" on another user's place suggests saving it to your own map.
- Size: S | Depends on: `PlaceCommentModule`, `PublicMapModule` | Why: bridges discovery and personal saving; Foursquare "wish list" mechanic.

**Ticket: User search and discovery**
- `GET /users/search?q=` endpoint (extend `UserModule`) returning public profiles by name or slug.
- Frontend: search box on `/discover` that switches between place search and user search.
- Size: S | Depends on: `PublicMapModule` | Why: follow graph is useless if you cannot find anyone to follow.

---

### 3.3 Trip & Journey Timelines

**Rationale.** Polarsteps builds beautiful trip journals by auto-stringing GPS pings into a trip arc. The pin-my-map model — saves timestamped to `createdAt`, with optional `visitedAt` (see Theme 3.1) — gives enough temporal data to do the same. The user defines a trip by name and date range; the app gathers matching saves, orders them on a map-plus-timeline view.

**Inspiration.** Polarsteps (trip timelines, map arc), Komoot (route tied to places), Roadtrippers (multi-stop trip planning).

---

**Ticket: Trip entity and CRUD**
- New `trip/` Nest module. `Trip` schema: owner, name, description, startDate, endDate, coverSavedPlaceId. M:N to `SavedPlace` through a `TripEntry` (savedPlaceId, position, dayNumber, note).
- `POST /trips`, `GET /trips`, `GET /trips/:id`, `PATCH /trips/:id`, `DELETE /trips/:id`. Trips are private by default; `isPublic` flag unlocks a public view at `/u/[slug]/trip/[tripId]`.
- Gamification: `trip_create` action, 10 pts.
- Size: L | Depends on: `SavedPlaceModule`, photo upload (for cover) | Why: fundamental new concept.

**Ticket: Auto-suggest saved places for a trip**
- When a user creates or edits a trip with a date range and bounding box (or named city), `GET /trips/:id/suggestions` returns saved places whose `visitedAt` (or `createdAt`) falls within the range.
- Frontend: wizard step after naming the trip — "We found 8 saved places from your Barcelona trip, add them?"
- Size: M | Depends on: trip entity, visitedAt (memory mode) | Why: removes manual data entry from the most common case.

**Ticket: Trip timeline view**
- Frontend route `/trips/[id]` renders a split panel: left = ordered list grouped by day, right = Mapbox map drawing a polyline through stops in order.
- Drag-and-drop reordering of stops within a day; reassign stop to a different day.
- Size: L | Depends on: trip entity, Mapbox GL direct usage | Why: the core value of the trip feature.

**Ticket: Public trip page**
- Read-only trip view at `/u/[slug]/trip/[tripId]`: timeline + map, cover photo, basic stats (N places, N days, N countries).
- Share button generating an OG image (map arc + trip name).
- Size: M | Depends on: trip entity, `PublicMapModule` pattern | Why: trips are shareable artifacts — the Polarsteps "trip album" moment.

**Ticket: Trip stats and gamification**
- On trip completion (user marks a trip done), compute stats: total distance (sum of great-circle distances between stops), number of countries, unique place types.
- New achievement: "First Trip" (1 trip completed), "Globetrotter Route" (trip spanning 3+ countries), "Road Warrior" (1000 km in a single trip).
- Size: S | Depends on: trip entity, existing achievement system | Why: closes the gamification loop on the new feature.

---

### 3.4 Collaborative Lists

**Rationale.** Google Maps "Saved" lets you share a list with edit access — a restaurant shortlist for a group trip, a wedding venue collection. The collection concept proposed in `docs/ideas/NEXT.md` (item #2) covers single-owner collections. Collaborative lists go one step further: multiple co-editors, an invite link, async updates visible to all members.

**Inspiration.** Google Maps collaborative lists, Pinterest boards (visual, shareable), Letterboxd lists (curated, social).

---

**Ticket: Collection entity and CRUD**
- Implement `docs/ideas/NEXT.md` item #2 as the foundation: `collection/` module, `Collection` schema (owner, name, description, isPublic, coverPlaceId), M:N to `SavedPlace`.
- Collection CRUD + add/remove saved place; filter chips on the main map scoped to a collection.
- Gamification: `collection_create` action, 5 pts.
- Size: M | Depends on: `SavedPlaceModule` | Why: prerequisite for collaborative lists.

**Ticket: Collection collaborators**
- Add `collaborators: [{ userId, role: 'editor'|'viewer' }]` to `Collection`. `POST /collections/:id/invite` generates a short-lived invite token; recipient accepts at `/invite/[token]` and is added as editor.
- Editors can add/remove saved places from the collection; only the owner can rename or delete it.
- Size: M | Depends on: collection entity, notification system (NEXT.md #1) | Why: the collaborative use case is what makes a collection worth sharing.

**Ticket: Collection public view**
- Public read-only view at `/u/[slug]/c/[collectionSlug]` for public collections; map + list of places with ratings and photos.
- `GET /public/slug/:slug/collections` lists all public collections for a user.
- Size: S | Depends on: collection entity, `PublicMapModule` | Why: shareable URL is the viral loop.

**Ticket: "Collaborative list" activity in feed**
- When a collaborator adds a place to a shared collection, emit a feed event (extends Theme 3.2 feed). Shown as "Alice added Brasserie Lola to your Tokyo trip list".
- Size: S | Depends on: collection collaborators, feed | Why: social feedback loop for collaborative editing.

---

### 3.5 Trip Planning & Itinerary Builder

**Rationale.** Trip timelines (Theme 3.3) look back at past trips. Trip planning looks forward. Citymapper excels at multi-modal routing; Komoot lets you plan a multi-day hiking route with waypoints. The pin-my-map version is simpler: a drag-and-drop day-by-day builder that organises saved places and wishlist items into an ordered itinerary with estimated walking time between stops.

**Inspiration.** Citymapper (multi-modal routing, commute save), Komoot (route saving, GPS tracks), Roadtrippers (trip planner with points of interest).

---

**Ticket: Itinerary mode on collections/trips**
- Add a planning mode to a collection or trip: each place gets a day assignment and a position. `PATCH /collections/:id/places` accepts an ordered list with `{ savedPlaceId, dayNumber, position }`.
- Frontend: drag-and-drop list in `/trips/[id]` or `/collections/[id]/plan`; day columns like a kanban board.
- Size: M | Depends on: trip entity or collection entity | Why: turns a flat list into an actionable plan.

**Ticket: Walking-time estimates between stops**
- For a trip/itinerary in planning mode, compute great-circle distance between consecutive stops (client-side, no routing API needed for MVP). Show "~12 min walk" between stops based on 5 km/h.
- Optional upgrade: call Mapbox Directions API for actual walking routes; render route polyline on the map.
- Size: S (distance) / M (Mapbox routing) | Depends on: itinerary mode | Why: helps users validate whether a day's plan is realistic.

**Ticket: "Day in the city" template generator**
- Given a city name (or bounding box) and a number of hours, suggest an ordered itinerary from the user's saved places in that area that have not been marked done yet.
- Simple heuristic: sort by rating descending, cluster by proximity, estimate walk time. No AI required for v1.
- Size: M | Depends on: itinerary mode, `SavedPlaceModule` filters | Why: answers "I have an afternoon in Paris, what should I do?" from the user's own curated list.

**Ticket: Export itinerary as PDF or shareable link**
- `GET /trips/:id/export.pdf` generates a simple day-by-day PDF: map thumbnail, place name, address, notes, walk times.
- Shareable link renders the same content as a read-only web page.
- Size: M | Depends on: trip entity, itinerary mode | Why: people print or screenshot itineraries; PDF satisfies the offline case.

---

### 3.6 Curated Discovery

**Rationale.** Atlas Obscura and Roadtrippers succeed by presenting curated, themed content — "35 hidden speakeasies in NYC", "the strangest museums in Europe". The existing `/public/discover` endpoint surfaces public maps by name but has no editorial layer. Adding admin-curated "Spotlights" and a "hidden gems near you" algorithmic feed gives users a reason to open the app even when they have nowhere specific in mind.

**Inspiration.** Atlas Obscura (themed editorial lists), Roadtrippers (curated points of interest), Foursquare (local tips, trending venues).

---

**Ticket: Editorial spotlight collections**
- Admin-only `POST /admin/spotlights` creates a curated collection of public saved places with a theme (title, description, hero image URL, placeIds from the canonical `Place` collection).
- Public endpoint `GET /public/spotlights` lists active spotlights; `/public/spotlights/:id` shows the map.
- Frontend: carousel on `/discover` page above the user map grid.
- Size: M | Depends on: `PlaceModule`, admin roles (`@Admin()`) | Why: gives the app an editorial identity beyond user-generated content.

**Ticket: "Hidden gems near you" feed**
- `GET /public/discover/nearby?lat&lng&radius` returns public saved places with high ratings that fewer than N people have saved (a proxy for "hidden gem").
- Rendered as a map-clustered view on `/discover` when the user grants geolocation.
- Size: M | Depends on: `PublicMapModule`, geolocation utils in `front/src/lib/utils/geolocation.ts` | Why: the most common discovery question is "what's good around here that I haven't found yet?"

**Ticket: "You might like" recommendation**
- After a user saves a place tagged "coffee" in a given city, surface other highly-rated coffee places in that city that people who also saved this place tend to save.
- Naive collaborative filter query in MongoDB (no ML needed): find users who saved the same place, find their other saves in the bounding box, rank by frequency.
- Size: L | Depends on: `SavedPlaceModule`, `PlaceModule`, tags | Why: the best recommendations come from taste-similar humans; this approximates that without external infrastructure.

**Ticket: Weekly curated digest email**
- Opt-in weekly email: one editorial spotlight + three "friends saved this week" highlights + one "you haven't visited this in 6 months" nudge.
- Extend the notification system (NEXT.md #1) with an email channel (Nodemailer or Resend SDK).
- Size: M | Depends on: notification system, editorial spotlights | Why: email is the highest-retention re-engagement channel for content-driven apps.

**Ticket: Themed "paths" (multi-stop editorial routes)**
- Admin can create a `Path`: ordered sequence of canonical places with a narrative (e.g. "Modernisme walk in Barcelona"). `GET /public/paths/:id` returns the places with walk order and Mapbox polyline.
- Users can "follow" a path: each place on the path is saved as a to-do; completing all marks the path done and awards a badge.
- Size: L | Depends on: editorial spotlights, `PlaceModule`, trip timeline frontend | Why: Atlas Obscura's "Trips" product; turns content into an active challenge.

---

### 3.7 Local Intelligence & Smart Filters

**Rationale.** The saved places list already supports filtering by tag and done status (see `GET /saved` in `back/src/saved/saved.controller.ts`). But there is no awareness of time ("open now"), weather, or the gap between saved and visited. Surface-level intelligence — showing the user what is near them right now, flagging stale saves, enabling rainy-day mode — makes the app useful in the moment, not just as a planning tool.

**Inspiration.** Google Maps (open-hours prominence), Foursquare (context-aware suggestions), Citymapper (real-world routing context).

---

**Ticket: "Open now" filter on map and list**
- Enrich the `Place` schema with `openingHours` (parsed from Google Places enrichment, already fetched via `back/src/enrichment/providers/google-places.provider.ts`). Add a `GET /saved?openNow=true` filter that computes current open/closed status server-side based on local timezone.
- Frontend: toggle chip "Open now" on saved list and map popup badge.
- Size: M | Depends on: `EnrichmentModule`, Google Places opening hours field | Why: the most searched-for filter in any place app.

**Ticket: "You haven't visited" smart list**
- `GET /saved?unvisited=true&savedBefore=180d` — places saved more than N days ago with `done: false`. Default view: the 10 oldest unvisited saves, sorted by distance from current location.
- Frontend: dedicated section "Forgotten places" on `/saved/list` or a push notification trigger (see Theme 3.9).
- Size: S | Depends on: existing `GET /saved` filter, geolocation | Why: most saves are never visited; this surfaces the value already in the database.

**Ticket: Rainy-day mode**
- Filter preset that shows only saved places tagged "indoor", "museum", "cafe", "gallery", or places where the enrichment data indicates indoor venue type.
- One-tap toggle; persists in a URL param so it can be shared ("here's my rainy-day Paris list").
- Size: S | Depends on: `TagModule`, `EnrichmentModule` venue type field | Why: a playful filter that users remember and mention.

**Ticket: Place proximity grouping on map**
- When zooming out, cluster markers show count AND the top-rated place name in the cluster. Clicking a cluster zooms to fit and highlights the cluster's best place.
- Implemented in Mapbox GL Supercluster with custom cluster properties; no backend change needed.
- Size: S | Depends on: Mapbox GL direct usage, `mapStore.ts` | Why: dense urban maps become unusable without smart clustering; this makes the map the primary navigation surface.

**Ticket: "Country stats" dashboard**
- Page `/profile/stats` showing: countries visited (derived from saved place addresses, already computed in `gamification.service.ts`'s `countryCount`), heat-map of activity by month, tag distribution pie.
- Pure frontend aggregation from existing `GET /saved` and gamification profile endpoints.
- Size: S | Depends on: `GamificationModule`, `SavedPlaceModule` | Why: personal stats are a high-engagement, low-cost feature; the data is already there.

---

### 3.8 Smart Import & Deduplication

**Rationale.** The existing import module (`back/src/import/`) handles Mapstr archives. But most users have years of Google Maps stars, screenshot saves, and browser bookmarks that represent their real place memory. Every import path that works well is a retention event. Dedup quality determines whether imported data enriches or pollutes the map.

**Inspiration.** Google Maps Takeout (JSON export), Mapstr (archive upload, already supported), browser extensions for saving pages.

---

**Ticket: Google Maps Takeout parser**
- Extend `ImportModule` to accept Google Maps "Saved Places" JSON (the format in `Takeout/Maps/Saved Places.json`). Parse name, address, lat/lng, note; dedup against existing places by coordinate proximity + name similarity.
- Frontend: import wizard step to select "Google Maps Takeout" as source type; drag-and-drop zip or JSON.
- Size: M | Depends on: `ImportModule`, `PlaceModule` dedup logic | Why: Google Maps is the primary competitor for place bookmarks; a one-click migration lowers the switching cost dramatically.

**Ticket: Browser extension (save current page's place)**
- Chrome/Firefox extension that detects when the active tab is a Google Maps place page, a Yelp page, or a TripAdvisor page; extracts name, address, and coordinates from the page DOM or URL; POSTs to `POST /place` + `POST /saved/:id` using a stored JWT.
- Size: L | Depends on: `PlaceModule`, `SavedPlaceModule`, OAuth token storage | Why: captures saves in the moment of discovery, which is on a restaurant's website or in a Google search, not inside another app.

**Ticket: Screenshot OCR import**
- Upload a screenshot of a Google Maps place, an Instagram location tag, or a restaurant menu. Backend calls a vision API (or a lightweight on-device model) to extract place name and optionally address. Pre-fills the place creation form.
- Size: XL (vision API dependency, accuracy concerns) | Depends on: `ImportModule`, external vision API | Why: the dominant save behaviour on mobile is a screenshot; meeting users there is a significant UX leap. Flag as ambitious bet.

**Ticket: Import dedup review UI**
- When an import batch produces potential duplicates (same name within 200 m of an existing place), instead of silently skipping, queue them in a "review" inbox at `/import/review`.
- User sees side-by-side: existing place vs incoming place; can merge, skip, or create separate.
- Size: M | Depends on: `ImportModule`, `PlaceModule` conflict model (already exists for enrichment conflicts) | Why: dedup without review leads to silent data loss; the conflict review pattern already exists for enrichment.

**Ticket: Re-import without duplicates (idempotent import)**
- Add an import fingerprint (hash of source + externalId if available) to `SavedPlace`; re-importing the same Mapstr archive a second time produces zero duplicates and only updates changed fields.
- Size: S | Depends on: `ImportModule`, `SavedPlace` schema | Why: users re-import after adding new saves in the source app; idempotency prevents chaos.

---

### 3.9 Notifications & Habits

**Rationale.** The notification system proposed in `docs/ideas/NEXT.md` (item #1) covers the plumbing: schema, SSE/polling, bell icon. This theme layers the habit-forming use cases on top: visit reminders, social nudges, travel-mode detection. Without a closed notification loop, features like follow, comments, and suggestions produce write-only actions.

**Inspiration.** Duolingo (streak maintenance, comeback prompts), Foursquare (you-haven't-checked-in prompts), Google Maps (you visited this area, add a review).

---

**Ticket: Visit reminder push notification**
- Prerequisite: notification system (NEXT.md #1). Add a notification type `visit_reminder` triggered when: (a) user is within 500 m of an unvisited saved place (requires geofencing or a client-side proximity check on app resume), or (b) a saved place has not been visited for 6 months.
- Client-side geofence check on map load using `utils/geolocation.ts`; server-side time-based reminders via a daily `@Cron` job.
- Size: M | Depends on: notification system, geolocation | Why: the core habit loop — save a place, get a nudge when you are nearby.

**Ticket: Social notification types**
- Implement the social notification payloads on top of the notification infrastructure: follow, comment on your public place, reaction on your place, collaborator added a place to your collection, someone visited a place you recommended.
- Payload-driven: `NotificationService.emit(userId, type, payload)` called from each feature module's service after the primary write.
- Size: M | Depends on: notification system, follow, place-comment, reactions, collections | Why: closes the loop that the social graph opened.

**Ticket: Notification preferences page**
- Frontend route `/settings/notifications` with per-type toggles (visit reminders, social, weekly digest, marketing) and channel toggles (in-app, email).
- Backend: `notificationPreferences` sub-document on `User` schema; checked before emitting.
- Size: S | Depends on: notification system | Why: GDPR compliance; also respects user attention.

**Ticket: Travel-mode auto-detection**
- When the user opens the app more than 100 km from their home location (derived from the centroid of their saved places), switch to "travel mode": hide done places, show top-rated unvisited, enable "open now" filter automatically.
- No explicit onboarding needed; the switch is silent and reversible.
- Size: M | Depends on: geolocation, smart filters (Theme 3.7) | Why: the app is most valuable when travelling; surfacing the right content at that moment is high-impact with low engineering cost.

---

### 3.10 Privacy & Data Ownership

**Rationale.** The GDPR export and delete proposed in `docs/ideas/NEXT.md` (item #7) is the legal baseline. This theme goes further: granular sharing (share one collection with specific friends, not your whole map), map-section privacy (hide places in a given neighbourhood from the public view), and a trustworthy ownership narrative that differentiates pin-my-map from platforms that monetise data.

**Inspiration.** Apple's privacy-first positioning, Polarsteps' private-by-default trip sharing, Google Maps' "Shared with you" link.

---

**Ticket: GDPR account export and delete**
- Implement `docs/ideas/NEXT.md` item #7 as specified: `GET /users/me/export` returns a zip; `DELETE /users/me` cascades deletes with a 7-day soft-delete grace period.
- Size: M | Depends on: touches all modules but no blocking ticket | Why: legal requirement before EU public launch.

**Ticket: Per-collection privacy controls**
- Collections (Theme 3.4) can be: private (owner only), shared-with-link (token-gated, like existing `publicToken` on user), shared-with-friends (visible only to followers), or public (indexed in discover).
- Backend: `visibility: 'private'|'token'|'followers'|'public'` on `Collection`; guard checks in service.
- Size: M | Depends on: collection entity, `FollowModule` | Why: the privacy hierarchy (self → friends → public) should apply to every shareable object, not just the whole map.

**Ticket: Place-level privacy override**
- On `SavedPlace`, add `visibility: 'private'|'public'` (defaults to the user's map-level `isPublic` setting). Private saved places are excluded from public map responses in `PublicMapModule`.
- Frontend: lock icon on place detail; bulk toggle "make all places in this tag private".
- Size: S | Depends on: `SavedPlaceModule`, `PublicMapModule` | Why: users may want to keep home, work, or sensitive places off their public map without disabling the whole public view.

**Ticket: Data portability — export to standard formats**
- `GET /users/me/export` (NEXT.md #7) includes, in addition to JSON, a KML file (importable to Google Maps) and a GeoJSON file (importable to QGIS, Mapbox Studio, any GIS tool).
- Size: S | Depends on: GDPR export ticket | Why: portability builds trust; KML export is a meaningful "you own your data" signal.

**Ticket: Audit log for the user (self-service)**
- `GET /users/me/audit` returns the user's own sensitive action log (logins, exports, deletes, role changes). The existing `AuditModule` (`back/src/audit/`) serves admin views; extend it with a user-scoped read endpoint.
- Size: S | Depends on: `AuditModule` | Why: transparency; users who can see their own log trust the platform more.

---

## 4. Anti-Roadmap

The following directions would dilute the product's identity or exceed the realistic capacity of a small team. They are explicitly out of scope unless the vision changes.

- **Full social network.** pin-my-map is not a place-centric Instagram. No stories, no reels, no algorithmic "for you" feed driven by engagement metrics. The social layer is friend-first and opt-in.
- **Restaurant/venue reviews for the public.** Canonical place pages should not become Yelp or TripAdvisor. Public place comments (`back/src/place-comment/`) exist for correction and context, not for competing with review platforms.
- **Real-time multi-player editing.** Collaborative lists (Theme 3.4) use async updates, not WebSocket presence. The engineering cost of real-time CRDT or OT is disproportionate to the value for a small-team project.
- **Native mobile apps (iOS/Android).** The SPA + PWA (NEXT.md #6) covers the mobile use case. Building separate native apps requires a team 3x the current size to maintain parity.
- **AI travel agent / LLM itinerary planner.** Tempting but premature. The MCP module (`back/src/mcp/`) already exposes the API to AI agents; let external tools build on that rather than embedding an LLM in the product core. Revisit in 2027 when the data set is richer.
- **Monetisation through data.** Place data and user behaviour are not for sale. Any future revenue model must be subscription or feature-gated, never advertising or data brokerage.
- **Route navigation / turn-by-turn.** Citymapper and Apple Maps solve this; pin-my-map surfaces the destination, not the journey to it.

---

## 5. Sequencing Suggestion

The themes above represent roughly 18–24 months of work for a two-person engineering team. The sequencing below prioritises themes that close existing gaps (unfinished social loop), unblock others (photos and notifications are prerequisites for many themes), and deliver user-visible value quickly.

### H1 2026 — Foundations (Q1–Q2)

**Priority 1: Photos & Memories (Theme 3.1)**
This is the single highest-leverage theme. It gives the existing save/rate/comment model an emotional dimension, directly addresses the gap identified in NEXT.md (#8), and produces the OG-image infrastructure that benefits share links and trip pages. S3 setup is the only infrastructure dependency.

**Priority 2: Notifications & Habits (Theme 3.9) — infrastructure only**
Implement the notification schema and emitter service (NEXT.md #1) without all notification types yet. This unblocks the social loop (Theme 3.2), collections (Theme 3.4), and trip planning (Theme 3.5) from emitting events. Ship the bell icon and visit-reminder type as the first live notification.

**Priority 3: Native Social Loop (Theme 3.2) — friend feed + reactions**
With follow already in place and notifications scaffolded, the friend activity feed is the next highest-retention feature. The "want to go" signal and reactions are small tickets that make the feed interactive without requiring a full comment system overhaul.

### H2 2026 — Growth (Q3–Q4)

**Priority 4: Collaborative Lists / Collections (Theme 3.4 + 3.6 partial)**
Ship single-owner collections first (NEXT.md #2), then add collaborator invites. Editorial spotlights can ship as a minimal admin UI layered on top of collections (a spotlight is just a staff-curated collection).

**Priority 5: Trip & Journey Timelines (Theme 3.3)**
Collections and photos are prerequisites. The trip entity and timeline view are the flagship "journeys over lists" feature; ship the MVP (create trip, add places, timeline view) and hold back the auto-suggest and path templating for H1 2027.

**Priority 6: Smart Import & Dedup (Theme 3.8) — Google Maps Takeout**
A Google Maps Takeout parser dramatically lowers acquisition friction. It does not depend on any other theme and can ship in a single sprint. Hold the browser extension and OCR for later.

### H1 2027 — Depth

**Privacy & Data Ownership (Theme 3.10):** GDPR export and delete before any broad marketing push. Per-collection privacy and place-level overrides follow as the sharing model matures.

**Local Intelligence (Theme 3.7):** "Open now" and the country stats dashboard are high-value, low-cost; ship them incrementally alongside other themes rather than as a dedicated wave.

**Trip Planning / Itinerary Builder (Theme 3.5):** Build on the trip entity shipped in H2 2026. The day-builder and PDF export are the headline features; walking-time estimates come for free from the Mapbox GL integration.

**Curated Discovery — full (Theme 3.6):** Editorial paths and the collaborative filter recommendation are longer bets; they need a critical mass of public place data to be meaningful.
