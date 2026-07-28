## 1. Schema and Migration Recovery

- [x] 1.1 Recover or recreate the missing tag migration so local migration history matches the current database state.
- [x] 1.2 Apply the auth schema migration for refresh tokens, email verification tokens, password reset tokens, and user lockout fields.
- [x] 1.3 Regenerate the Prisma client and confirm the generated types reflect the new auth models.

## 2. Backend Auth Flow

- [x] 2.1 Update login to issue a short-lived access token plus a rotating refresh token with minimal JWT claims.
- [x] 2.2 Implement refresh-token persistence, hashing, rotation, and revocation in the auth service.
- [x] 2.3 Add `/auth/refresh` and `/auth/logout` endpoints with proper guards and token invalidation.
- [x] 2.4 Add email verification and password reset flows backed by the new token tables.
- [x] 2.5 Add login failure counting, temporary lockout handling, and failed-attempt reset on success.
- [x] 2.6 Harden auth endpoints with rate limiting, security headers, and strict origin checks.

### Must-have additions

- [x] 2.7 Integrate a delivery mechanism for verification and reset tokens (email provider or dev logging fallback).
- [x] 2.8 Add config validation and bootstrap checks for `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, and `JWT_REFRESH_EXPIRES_IN`.
- [x] 2.9 Add integration tests covering login → refresh rotation → logout, verification, reset, and lockout flows.

- [x] 2.10 Add `GET /auth/verify-email` endpoint that accepts `?token=...`, invokes the same verification logic, and redirects (302/303) to a configurable frontend URL with a status (success/expired/invalid).
- [x] 2.11 Make verification email URL configurable (API verify endpoint vs frontend page) and update `MailService` to use the API verify URL by default for one-click verification.
- [x] 2.12 Add integration and e2e tests for the GET verification + redirect flow, including prefetch/bot protections and rate-limit behavior.

## 3. Web Client Updates

[x] 3.2 Store refresh tokens in HttpOnly Secure SameSite cookies and keep access tokens in memory only.
[x] 3.3 Remove any token persistence paths that rely on localStorage or other unsafe browser storage.

- [x] 3.6 Implement a small frontend handler that accepts the redirect query params from the API (`status`, optional `message`) and renders appropriate UI and analytics events.
- [x] 3.7 Add a frontend flow that can POST the token to `POST /auth/verify-email` as a fallback (for clients that prefer frontend-mediated verification) and handle responses gracefully.
- [x] 3.8 Add web integration tests: clicking the verification email link → API verify (GET) → redirect → landing page shows correct status.
- [x] 3.9 Document `EMAIL_VERIFY_URL` / `APP_URL` usage for frontend vs API verify link and how to configure environment variables for staging/production.

## 4. Mobile Client Updates

- [x] 4.1 Update mobile login to store refresh tokens in expo-secure-store and keep access tokens in memory.
- [x] 4.2 Add refresh-token bootstrap logic so the app restores sessions after restart when the refresh token is valid.
- [x] 4.3 Update logout to clear both in-memory tokens and secure storage.
- [x] 4.4 Add deep-link / universal-link handling for email verification so the app can receive either a direct `GET` redirect or a token query param and route to an in-app verification screen.
- [x] 4.5 Implement an in-app verification handler that extracts the token and calls `POST /auth/verify-email` (or follows API GET redirect behavior) and shows success/failure UI.
- [x] 4.6 Provide a fallback web redirect flow when the app is not installed: the verification link should still land on the web `/email-verified` page.
- [x] 4.7 Add mobile e2e tests for deep links: unopened-app install flow, in-app flow, and fallback web redirect behavior.
- [x] 4.8 Document mobile configuration for deep links, universal links, and the preferred `EMAIL_VERIFY_URL` value for app/native flows.

## 5. Verification and Documentation

- [x] 5.1 Add unit tests for refresh rotation, revocation, login failure lockout, and token expiry rejection.
- [x] 5.2 Add tests for email verification and password reset token lifecycle.
- [x] 5.3 Update API and app documentation so the new auth contract is explicit for web and mobile clients.
- [x] 5.4 Document the one-click verification flow: the `GET /auth/verify-email` redirect behavior, frontend landing pages, and the `APP_URL` / `EMAIL_VERIFY_URL` configuration.
