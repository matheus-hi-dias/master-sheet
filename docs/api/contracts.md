# API Contracts

Reconciled REST endpoint reference, cross-checked against `apps/api` source. DTOs live in `apps/api/src/*/dto/`. All mutation routes validate via the global `ValidationPipe` (`whitelist: true`).

## Conventions

- **Platform selection:** clients send the `x-client-platform` header (`web` default, `mobile`) so auth responses choose cookie vs. secure-store handling.
- **Refresh cookie (web):** `master-sheet-refresh-token`, set as HttpOnly, Secure, SameSite.
- **Named throttles** (see `openspec/specs/api-rate-limiting/spec.md`): `strictAuth`, `tokenRefresh`, `passwordReset`, plus the general endpoint limit (120/min).
- **Errors:** standard NestJS HTTP exceptions; throttled requests return `429` with `{ statusCode: 429, message: "Throttled" }`.

## Auth Module

| Method | Route                           | Description                                        | DTO / Protection                        | Throttle         |
| :----- | :------------------------------ | :------------------------------------------------- | :-------------------------------------- | :--------------- |
| `POST` | `/auth/register`                | Create user; bcrypt-hashed password; no `password` in response. | `RegisterDto` / Public         | `strictAuth` 3/min   |
| `POST` | `/auth/login`                   | Verify credentials; issue access token; set refresh cookie (web). | `LoginDto` / Public             | `strictAuth` 5/min   |
| `POST` | `/auth/refresh`                 | Rotate refresh token; return fresh access token.   | `RefreshTokenDto` / Public             | `tokenRefresh` 60/min |
| `POST` | `/auth/logout`                  | Revoke session and clear refresh cookie.           | `RefreshTokenDto` / Public             | `strictAuth` 30/min  |
| `POST` | `/auth/verify-email`            | Programmatic email verification.                   | `VerifyEmailDto` / Public              | `strictAuth` 5/min   |
| `GET`  | `/auth/verify-email`            | One-click verify; redirects to `<base>/email-verified?status=success\|expired\|invalid`. | `token` query / Public | `strictAuth` 5/min   |
| `POST` | `/auth/password-reset/request`  | Issue a one-time password reset token.             | `RequestPasswordResetDto` / Public      | `passwordReset` 3/hr |
| `POST` | `/auth/password-reset/confirm`  | Apply new password with a single-use token.        | `ConfirmPasswordResetDto` / Public      | —                   |
| `GET`  | `/auth/me`                      | Current user payload (`ActiveUser`).               | `JwtAuthGuard`                          | —                   |

## Templates Module

Everything under `/templates` applies `JwtAuthGuard` at the controller level; ownership is enforced per-route.

| Method   | Route               | Description                                           | DTO / Protection              |
| :------- | :------------------ | :---------------------------------------------------- | :---------------------------- |
| `POST`   | `/templates`        | Create a template skeleton (JSON) with tags.          | `CreateTemplateDto` / `JwtAuthGuard` |
| `GET`    | `/templates`        | List templates (own + public); filters `tags` (comma-separated) and `isPublic`. | `JwtAuthGuard` |
| `GET`    | `/templates/:id`    | Return full structure for dynamic rendering (public or owner). | `TemplateAccessGuard` |
| `PATCH`  | `/templates/:id`    | Update template (owner only).                         | `UpdateTemplateDto` / `OwnerGuard` |
| `DELETE` | `/templates/:id`    | Delete template; returns `204` (owner only).          | `OwnerGuard`                  |

### Structure Id Convention

Field `id`s are the canonical reference for formula `expression` identifiers and `dependencies`, and are the keys persisted in `Sheet.data`. Builders generate human-readable, label-derived (slugified, deduplicated) ids for new fields and keep formula references in sync when a still-auto id changes; externally supplied ids are preserved. This is a client-side convention — the API validates ids only as `string` (dependencies must resolve to existing numeric fields, depth-1, acyclic).

## Sheets Module — Planned

The `Sheet` model exists in `apps/api/prisma/schema.prisma`, but no controller/service is implemented yet. Planned surface (per `openspec/changes/multi-system-rpg-template-engine/` and screen docs):

| Method  | Route          | Description                                        | Protection          |
| :------ | :------------- | :------------------------------------------------- | :------------------ |
| `POST`  | `/sheets`      | Instantiate a Sheet from a `templateId`.           | `JwtAuthGuard`      |
| `PATCH` | `/sheets/:id`  | Merge partial JSON updates into `Sheet.data`.      | `OwnerGuard`        |
| `GET`   | `/sheets`      | List the current user's sheets.                    | `OwnerGuard`        |

## Root

| Method | Route | Description            | Protection |
| :----- | :---- | :--------------------- | :--------- |
| `GET`  | `/`   | Greeting/health probe (plain text).   | Public |

---

Keep this document in sync whenever API contracts change (`Job: always update on endpoint/DTO/guard/throttle modifications`).