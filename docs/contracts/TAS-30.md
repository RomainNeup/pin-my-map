# TAS-30 — Edit a place

**Epic:** Place-general  •  **Priority:** Nice  •  **Status:** draft
**Branch:** `tas-30-31-place-edit-details`

## Background

Currently `PUT /place/:id` is `@Admin()`. Non-admin users only have the `Suggestion` flow. TAS-30 adds a fast-path: a regular user can directly edit a place if they are its **creator** (place must remember its creator) — otherwise they continue using suggestions.

## Schema change

Add `@Prop({ type: Types.ObjectId, ref: 'User', required: false }) createdBy?: Types.ObjectId` to `Place` entity. Backfill: leave existing places without a creator (they fall through to suggestion flow).

`PlaceService.create` must set `createdBy = userId`.

## Routes

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| PUT    | /place/:id | @Private | 200 if user is admin OR `place.createdBy === user.id`; else 403 |

Keep the existing admin path working — same handler, different authorization branch in the service.

`UpdatePlaceRequestDto` mirrors `CreatePlaceRequestDto`.

## Audit

Log via `AuditService.log({ actor: userId, action: 'place.update', targetType: 'Place', targetId: id, before, after })` for **all** edits (admin and creator).

## Gamification

No new action — editing your own place is not rewarded.

## Frontend

- `front/src/lib/api/place.ts`: `updatePlace(id, payload)`.
- `front/src/routes/place/[id]/+page.svelte`: show "Edit" button when `place.createdBy === currentUser.id` OR `currentUser.role === 'admin'`. Need backend to expose `createdBy` in `PlaceDto`.

PlaceDto gets `createdBy?: string`.
