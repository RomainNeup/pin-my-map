# TAS-19 — Manage members

**Epic:** User  •  **Priority:** Nice  •  **Status:** back-ready
**Branch:** `tas-18-19-20-25-34-user-admin`

## Goal

Admin can list, search, edit role, suspend, and delete users. Most of this exists; TAS-19 adds:

- `?q=` search (name/email contains, case-insensitive) on `GET /user`.
- `?status=` filter on `GET /user` (active|pending|rejected|suspended).
- New status `'suspended'` (extend the enum from TAS-18) — admin-set; suspended users can't log in.
- `POST /user/:id/suspend` (`@Admin`, body `{ reason?: string }`) and `POST /user/:id/unsuspend`.
- Admin can manually create a user (invite-mode): `POST /user` (`@Admin`, body `{ name, email, role }`); generates a random password and triggers password-reset email so the user sets their own (depends on TAS-33 mailer; if mailer not yet ready, return the temporary password in the response under `tempPassword` for v1).

## Routes summary

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET    | /user | @Admin | adds `q`, `status` query params |
| POST   | /user | @Admin | invite/create — body InviteUserDto |
| POST   | /user/:id/suspend | @Admin | body `{ reason? }`, audit |
| POST   | /user/:id/unsuspend | @Admin | audit |

## DTOs

```ts
export class InviteUserDto {
  @IsString() @MinLength(2) @MaxLength(80) name: string;
  @IsEmail() email: string;
  @IsIn(['user', 'admin']) role: 'user' | 'admin';
}
export class SuspendUserDto { @IsOptional() @IsString() @MaxLength(500) reason?: string; }
```

## Audit

`user.create`, `user.suspend`, `user.unsuspend`.

## Frontend (front-admin-users)

- `/admin/users/+page.svelte`: search box, status filter, per-row menu "Edit role / Suspend / Unsuspend / Delete". "Invite user" button → modal.
