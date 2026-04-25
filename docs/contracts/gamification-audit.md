# Gamification Audit — Wave 5 checklist

**Status:** complete — 1 fix applied (TAS-40), 7 already-OK.

For each TAS-38..TAS-45 ticket, the auditor confirms the catalog action exists, points are awarded once-per-unique-event, and the calling site is in the correct service:

| Ticket | Action | Catalog | Awarded in | Once-per-unique | Status |
|--------|--------|---------|------------|-----------------|--------|
| TAS-38 saving | save | ✅ 10 pts | SavedPlaceService.create (safeAward) | place already-saved guard throws → once per user×place | ✅ |
| TAS-39 comment | comment | ✅ 3 pts | SavedPlaceService.addComment (safeAward) | `wasEmpty` guard — first comment per saved place only | ✅ |
| TAS-40 suggestion | suggestion | ✅ 5 pts | **was** SuggestionService.approve → **fixed** to SuggestionService.create | once per submitted suggestion (consistent with backfill) | 🔧 fixed |
| TAS-41 new place | place_create | ✅ 15 pts | PlaceService.create (try/catch after save) | once per place at creation time | ✅ |
| TAS-42 see points | (read) | n/a | GamificationController GET /gamification/me → getProfile | n/a | ✅ |
| TAS-43 level | (read) | n/a | levelFromPoints helper, exposed in GamificationProfileDto | n/a | ✅ |
| TAS-44 rewards | achievements catalog | ✅ 15 achievements in ACHIEVEMENTS array | award() iterates ACHIEVEMENTS, returns newlyUnlocked; catalog exposed via getProfile | $ne guard prevents duplicate unlock | ✅ |
| TAS-45 follow | follow | ✅ 2 pts | FollowService.follow (try/catch, inside !existing guard) | only when follow is new (existing check) | ✅ |

## Gap detail — TAS-40

The `suggestion` award was placed in `SuggestionService.approve()` (admin action) instead of
`SuggestionService.create()` (user action). This was wrong for two reasons:

1. **Wrong actor** — the ticket says users earn points for *submitting* a suggestion, not for admins
   approving it. Approval may never come (rejected suggestions would never earn points).
2. **Backfill mismatch** — `recompute()` counts `suggestionsSubmitted` as all suggestion documents
   by user regardless of status, so backfill credited points on creation; live-award on approve
   would double-count on backfill + re-award when approved.

**Fix applied:** moved `gamificationService.award(userId, 'suggestion')` from `approve()` into
`create()`, inside a `try/catch`, after the primary write and audit log. The `approve()` method
no longer awards points.
