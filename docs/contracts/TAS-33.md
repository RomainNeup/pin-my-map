# TAS-33 — Forgot password

**Epic:** User  •  **Priority:** Should  •  **Status:** draft
**Branch:** `tas-33-forgot-password`

## Goal

Email-based password reset.

## New module

`back/src/mailer/`:
- `mailer.module.ts` — global module, exports `MailerService`.
- `mailer.service.ts` — `sendMail({ to, subject, html, text })`. Uses **nodemailer** with SMTP env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`). When SMTP env vars are missing (dev), log the email body to console at INFO level instead of sending — never crash. Single integration test using `nodemailer-mock` is fine.

Add to `back/.env.example`: `SMTP_HOST=`, `SMTP_PORT=`, `SMTP_USER=`, `SMTP_PASS=`, `MAIL_FROM=no-reply@pin-my-map.local`, `APP_URL=http://localhost:5173`.

## Schema change

`User` gets `passwordResetTokenHash?: string` and `passwordResetExpiresAt?: Date`.

## Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST   | /auth/forgot-password | public, throttled 3/min | body `{ email }`. Always 204 (do not leak account existence). If user found and active, generate token, store hash (sha256), email link `{APP_URL}/reset-password?token=...`. Token TTL: 1 hour. |
| POST   | /auth/reset-password | public, throttled 5/min | body `{ token, newPassword }`. 400 on invalid/expired. 200 on success — clears token, updates password. |

## DTOs

```ts
export class ForgotPasswordDto { @IsEmail() email: string; }
export class ResetPasswordDto {
  @IsString() @Length(40, 80) token: string;
  @IsString() @MinLength(8) @MaxLength(128) newPassword: string;
}
```

## Audit

`auth.password_reset_requested`, `auth.password_reset_completed` (do not log token).

## Frontend (front-auth-reset)

- New routes: `/forgot-password/+page.svelte`, `/reset-password/+page.svelte` (reads `?token=` from URL).
- `lib/api/auth.ts`: `forgotPassword(email)`, `resetPassword(token, newPassword)`.
- Login page: link "Forgot password?" → `/forgot-password`.
