# TAS-10 — Approve places add/edit

**Epic:** Place-general  •  **Priority:** Should  •  **Status:** draft
**Branch:** `tas-10-46-suggestions`

## Background

Suggestion flow already covers edits (via `SuggestionController`). TAS-10 adds **moderation of newly-created places** so a fresh place is hidden from feeds until an admin approves it.

## Schema change

`Place` gets `@Prop({ default: 'pending' }) moderationStatus: 'pending' | 'approved' | 'rejected'` and `@Prop() rejectionReason?: string`.

Migration / backfill: existing places get `moderationStatus = 'approved'`. Add a one-shot `approveAllExisting()` on PlaceService, called from the module's `onModuleInit` only when count of `moderationStatus: { $exists: false }` > 0.

## Behavior

- `PlaceService.create` writes `moderationStatus: 'approved'` if the user is admin, else `'pending'`.
- Public listings (`GET /place`, search, public-map) filter `moderationStatus: 'approved'`. The creator can still see their own pending place on `GET /place/:id`.
- `GET /place/pending` (`@Admin`) — list pending.
- `POST /place/:id/approve` (`@Admin`) — set approved; audit `place.approve`.
- `POST /place/:id/reject` (`@Admin`, body `{ reason?: string }`) — set rejected; audit `place.reject`.

## DTOs

```ts
export class PlaceModerationDto {
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export class RejectPlaceDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
```

`PlaceDto` gains `moderationStatus` (only exposed to admin & creator — everyone else always sees `'approved'`).

## Audit

`place.approve` and `place.reject` via existing `AuditService`.

## Gamification

`place_create` already exists; only award when status becomes `'approved'`. Move the `award` call from `PlaceService.create` to either approval or first-create when admin (so creating-then-rejected does not earn points).

## Frontend (front-admin-suggestions)

- `front/src/routes/admin/suggestions/+page.svelte`: add a tabbed UI — "Edits" (existing suggestions) and "New places" (pending places).
- `front/src/lib/api/place.ts`: `listPending()`, `approve(id)`, `reject(id, reason)`.
