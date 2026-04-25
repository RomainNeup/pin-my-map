# TAS-28 — Follow / Unfollow (gap-fill)

**Epic:** User  •  **Priority:** Nice  •  **Status:** back-ready
**Branch:** `tas-28-follow`

Most of this exists. TAS-28 adds the missing affordances:

## Backend

- `GamificationService.award(followerId, 'follow')` is **already** in the catalog. Confirm `FollowService.follow` calls it once per unique target (in try/catch, after the write). Add the call if missing.
- New endpoint `GET /follow/:userId/is-following` (`@Private`) returning `{ following: boolean }`. Used by the front to render Follow vs Unfollow buttons without fetching the full following list.
- `FollowUserDto` already has the followed user's basic info; ensure it includes `isPublic` so the front knows whether to show a "View map" link.

## Routes summary

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /follow/:userId/is-following | @Private | 200 `{ following: boolean }` |

(Other follow routes already exist and are unchanged.)

## Frontend (front-follow)

- `front/src/routes/following/+page.svelte`: tabbed view "Following" | "Followers" using existing `myFollowing` / `myFollowers` endpoints. Per row: avatar, name, level, "View map" button (when isPublic), Unfollow button.
- Reuse on user profile pages and on user-search results: a small `<FollowButton userId>` component that uses the new `is-following` endpoint to decide its initial state, then toggles via existing follow/unfollow.

## Tests

Backend spec: `is-following` returns true/false correctly; gamification awarded once.
