# TAS-25 — Search for user

**Epic:** User  •  **Priority:** Nice  •  **Status:** draft
**Branch:** `tas-18-19-20-25-34-user-admin`

## Goal

Public-ish search of users by name/slug, used by the discover/follow flows.

## Route

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET    | /user/search | @Private | 200 PublicUserDto[] — `?q=` required, min 2 chars, returns up to 20 |

Only returns users with `isPublic: true` (so private users are not enumerable). Excludes the requester. Sorted by name asc.

## DTO

```ts
@ApiSchema({ name: 'Public User' })
export class PublicUserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ required: false }) publicSlug?: string;
  @ApiProperty() points: number; // pull from gamification (default 0)
  @ApiProperty() level: number;  // levelFromPoints(points).level
}
```

`UserService.search(q, requesterId)` does a regex match on `name` (escape input) and `publicSlug`, then enriches with gamification points (single `find` on UserGamification, then merge in memory). Index hint: ensure `name` field has a (non-unique) text index — add it in entity.

## Frontend (front-user-search)

- New `front/src/lib/components/user/UserSearch.svelte`: input, debounced 250ms, dropdown with results (avatar placeholder, name, level badge, link to `/u/[slug]` or `/u/[id]`).
- Mounted in shell header (next to user menu) and on `/discover`.
