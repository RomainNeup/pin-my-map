# TAS-8 — Profile page

**Epic:** User  •  **Priority:** Nice  •  **Status:** front-only
**Branch:** `front/tas-8-34-profile`

The `/profile` route already exists. TAS-8 polishes it as the user's hub:

## Sections (vertical layout, top to bottom)

1. **Identity card** — avatar (initials chip), name, email, role badge, level + points (from gamification).
2. **Editable profile fields** (TAS-34): see TAS-34 contract.
3. **Public map settings** (already exists — link/embed it).
4. **Stats summary** — counts of saved places / tags / suggestions / followers / following.
5. **My suggestions** (TAS-46 — reuse the section landed in Wave 1).
6. **Achievements** — gamification badges grid (already exists; ensure it's surfaced here).
7. **Danger zone** — change password, delete account.

## Files

- `front/src/routes/profile/+page.svelte` (refactor into composed sections under `lib/components/profile/`).
- New: `lib/components/profile/IdentityCard.svelte`, `StatsSummary.svelte`, `DangerZone.svelte`.

No backend work needed beyond TAS-34.
