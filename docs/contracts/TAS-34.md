# TAS-34 — Manage profile

**Epic:** User  •  **Priority:** Nice  •  **Status:** back-ready
**Branch:** `tas-18-19-20-25-34-user-admin`

## Goal

User can edit their own profile: name, email (with password re-entry), and change password.

## Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| PATCH  | /user/me | @Private | body UpdateMeDto |
| POST   | /user/me/change-password | @Private | body ChangePasswordDto, 401 if current wrong, 200 |
| DELETE | /user/me | @Private | body `{ password: string }`, 401 if wrong; soft-delete (set `status: 'rejected'`, anonymize email — full hard delete is its own ticket) |

## DTOs

```ts
export class UpdateMeDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @ValidateIf(o => !!o.email) @IsString() @MinLength(1) currentPassword?: string;
}

export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(8) @MaxLength(128) newPassword: string;
}
```

Email uniqueness enforced; reject 409 if taken.

## Frontend (front-profile)

- `/profile/+page.svelte`: profile editor — name (always editable inline), email + currentPassword (gated form), change password form, danger zone "Delete account".
- `lib/api/user.ts`: `updateMe()`, `changePassword()`, `deleteMe(password)`.
