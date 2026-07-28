# Design: GET email verification + redirect

## Goal

Design an API GET endpoint that reuses existing verification logic, returns a user-friendly UX via redirects, and preserves security properties (single-use, hashed tokens, short TTL).

## API

- Endpoint: `GET /auth/verify-email?token=<token>`
  - Query params: `token` (required), optional `redirect` (overrides default redirect base for debugging)
  - Behavior: call the same verification logic used by `POST /auth/verify-email` (verify token hash, expiry, mark `user.emailVerified=true`, delete token record).
  - Response: 302 redirect to a frontend landing page computed from configuration with one of these status query params: `status=success|expired|invalid` and optionally `message=<urlencoded-message>`.
  - Rate limiting: apply existing rate limiter for `/auth/verify-email` in `main.ts` (already configured).

## Redirect targets

- Config:
  - `EMAIL_VERIFY_REDIRECT_BASE` or reuse `FRONTEND_URL` / `APP_URL`.
  - Constructed redirect: `${EMAIL_VERIFY_REDIRECT_BASE:-APP_URL}/email-verified?status=<...>&message=<...>`

## Error mapping

- Valid token: `status=success`
- Expired or not found: `status=expired` (if expired) or `status=invalid` (if not found/used)
- Server error: `status=invalid&message=server_error` (log and surface minimal info)

## Sequence diagrams

Frontend-mediated (existing POST fallback):

Emailed Link -> User's Mail Client -> Browser
Browser -> Frontend `/email-verify?token=...`
Frontend -> POST `/auth/verify-email` (body: { token })
API -> verify token and respond
Frontend -> Show success/failure UI

Direct API GET (recommended):

Emailed Link -> User's Mail Client -> Browser / Mobile
Browser -> GET `/auth/verify-email?token=...`
API -> verify token, delete token record
API -> 302 redirect to `${FRONTEND_URL}/email-verified?status=success`
Browser -> Render landing page showing success

## Token and security details

- Token lifecycle remains unchanged: random token (32 bytes hex), hashed in DB with `sha256`, expires in 24h, deleted on use.
- Protect against token prefetch/prefetching crawlers:
  - Keep TTL short (already 24h) and single-use deletion.
  - Consider adding a short confirmation step in the frontend when `X-Prefetch` or suspicious UA detected (optional).
- Rate limiting: already applied per-route in `main.ts` — keep limits conservative.
- Logging & telemetry: log verification attempts (success/expired/invalid) with non-sensitive metadata (IP, user-agent, token jti not included), and capture metrics for rates and failures.

## Frontend landing page

- Path: `/email-verified`
- Behavior:
  - Read `status` and optional `message` query params.
  - Render clear copy and call-to-action: on success, show `Go to login` and maybe `Get started` links; on expired/invalid, show `Resend verification email` and `Contact support` actions.
  - Track analytics event `email_verification.clicked` with `status` tag.

## Mobile deep-linking

- Verification emails should point to the API GET endpoint which can redirect to app universal link scheme if configured (e.g., `myapp://email-verified?status=success`) — configure via `EMAIL_VERIFY_REDIRECT_BASE` per platform.
- Implement in-app handler that can receive `token` query param (from deep-link) and POST to `POST /auth/verify-email` as a fallback if direct app verification flow is preferred.

## Tests

- Unit tests: token verification success, expired token, invalid token for both POST and GET handlers.
- Integration/e2e: email sending flow → click link → API GET → redirect → landing page shows `success`.
- Mobile e2e: deep-linking and fallback web redirect.

## Backwards compatibility

- Keep `POST /auth/verify-email` unchanged. `MailService` default will switch to `EMAIL_VERIFY_URL` pointing to API GET; operators can revert to frontend-mediated flow by setting `EMAIL_VERIFY_URL` accordingly.
