# Gamification Audit — Wave 5 checklist

**Status:** assigned to `gamification-auditor` agent.

For each TAS-38..TAS-45 ticket, the auditor confirms the catalog action exists, points are awarded once-per-unique-event, and the calling site is in the correct service:

| Ticket | Action | Catalog | Awarded in | Once-per-unique | Status |
|--------|--------|---------|------------|-----------------|--------|
| TAS-38 saving | save | ? | SavedPlaceService.create | place×user | |
| TAS-39 comment | comment | ? | SavedPlaceService.addComment | first comment per saved | |
| TAS-40 suggestion | suggestion | ? | SuggestionService.create | once per suggestion | |
| TAS-41 new place | place_create | ? | PlaceService.create / approve | once per place when approved | |
| TAS-42 see points | (read) | n/a | GamificationController.getMe | n/a | |
| TAS-43 level | (read) | n/a | levelFromPoints helper | n/a | |
| TAS-44 rewards | (achievements catalog) | ACHIEVEMENTS array | award() iterates ACHIEVEMENTS | yes | |
| TAS-45 follow | follow | ? | FollowService.follow | per (follower, target) | |

Auditor fills the Status column with ✅ / 🔧 (fix needed, with brief note) / ❌ (gap to file as new ticket).
