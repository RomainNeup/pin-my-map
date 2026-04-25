# TAS-18 — Approve member

**Epic:** User  •  **Priority:** Bonus  •  **Status:** back-ready
**Branch:** `tas-18-19-20-25-34-user-admin`

## Goal

Admin can approve or reject newly-registered users when the system is in `approval-required` mode (see TAS-20).

## Schema change

Add to `User` entity:
- `@Prop({ default: 'active', enum: ['active', 'pending', 'rejected'] }) status: 'active' | 'pending' | 'rejected'`
- `@Prop() rejectionReason?: string`

Backfill existing users to `'active'` on module init.

## Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET    | /user/pending | @Admin | 200 UserProfileDto[] (status=pending) |
| POST   | /user/:id/approve | @Admin | 200 UserProfileDto, audit `user.approve` |
| POST   | /user/:id/reject | @Admin | 200 UserProfileDto, body `{ reason?: string }`, audit `user.reject` |

## Behavior

- `AuthService.register`: if `Config.registrationMode === 'approval-required'`, write user with `status: 'pending'`. Otherwise `'active'`.
- `AuthService.login`: reject login with 403 if user.status !== 'active' (message includes status + rejectionReason for pending/rejected).
- Approving sets `status: 'active'`. Rejecting sets `status: 'rejected'` with reason.

## DTOs

```ts
export class RejectUserRequestDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
```

`UserProfileDto` gains `status` and `rejectionReason?`.

## Audit

`user.approve`, `user.reject` via existing AuditService.

## Frontend (front-admin-users)

- `/admin/users/+page.svelte`: tab "Pending" shows `listPending()`; per-row Approve / Reject (reason inline) buttons.
