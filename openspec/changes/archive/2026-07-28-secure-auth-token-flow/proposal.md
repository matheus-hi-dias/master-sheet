# Proposal: One-click email verification (API GET + redirect)

## Summary

Add a `GET /auth/verify-email?token=...` endpoint to the API that performs email verification server-side and then redirects users to a configurable frontend landing page showing verification status (success/expired/invalid). This creates a one-click verification experience for email recipients while preserving the existing `POST /auth/verify-email` for programmatic use and debug workflows.

## Motivation

- Improve UX for users clicking verification emails (works in mobile email clients and non-JS environments).
- Reduce friction and support deep-linking into native apps via universal links / deep links.
- Maintain secure single-use tokens and reuse existing verification logic.

## Scope

- Add `GET /auth/verify-email` that accepts `token` as a query param and calls the same verification logic as `POST /auth/verify-email`.
- On success, redirect (302/303) to a configurable frontend URL like `${FRONTEND_URL:-APP_URL}/email-verified?status=success` (include `status` values: `success`, `expired`, `invalid`).
- Update `MailService` to use an `EMAIL_VERIFY_URL` config value; default to the API GET verify endpoint for one-click verification.
- Keep `POST /auth/verify-email` unchanged for programmatic verification and automated tests.
- Add docs, tests, telemetry, and web/mobile landing pages and deep-link handling tasks.

## Acceptance criteria

- A GET request to `/auth/verify-email?token=<valid-token>` marks the user's email as verified and redirects to the configured frontend success URL.
- Invalid/expired tokens redirect to the configured frontend error URL with `status=expired|invalid` and an optional human message.
- `MailService` uses `EMAIL_VERIFY_URL` and defaults to the API GET path when not overridden.
- Rate limiting and single-use token deletion remain in place to prevent abuse.
- Web and mobile landing pages render appropriate UI and analytics events.

## Rollout plan

1. Implement the `GET` handler and tests in the API; keep current POST behavior intact.
2. Update `MailService` to use the configured `EMAIL_VERIFY_URL` (set to API GET by default).
3. Deploy API change behind feature flag (if available) or to staging; exercise email flow in staging.
4. Implement frontend `/email-verified` landing page and mobile deep-link handling.
5. Update docs and open-spec tasks; run e2e tests for web and mobile flows.

## Configuration

- `EMAIL_VERIFY_URL` — full URL template used in verification email. Examples:
  - API GET (one-click): `https://api.example.com/auth/verify-email?token={{token}}`
  - Frontend page (frontend-mediated): `https://app.example.com/email-verify?token={{token}}`
- `EMAIL_VERIFY_REDIRECT_BASE` or reuse `APP_URL`/`FRONTEND_URL` to compute redirect targets after API GET verification.

## Risks & mitigations

- Prefetching/crawler clicks may consume tokens: mitigate via short token lifetime, single-use deletion, and optional confirmation step on frontend if desired.
- GET mutates state (semantic concern): documented as acceptable for email verifications; code path uses single-use tokens.
- CORS complexity avoided by using API GET; frontend POST remains as fallback.

## Next steps / tasks

- See `tasks.md` for line-item tasks. Implement API changes, MailService config change, landing pages, mobile deep-link handling, and tests.
