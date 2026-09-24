# authentication Specification

## Requirements

### Requirement: Credential Storage & Hashing
User passwords MUST be hashed with `bcrypt` at a cost factor of 10 before persistence and MUST never be returned in any API response. Authentication secrets and API keys MUST be injected via `ConfigService` with `Joi` schema validation; raw `process.env` access inside services or controllers is forbidden.

#### Scenario: Registering a user
- **WHEN** a client posts a valid `RegisterDto` to `/auth/register`
- **THEN** the password is stored as a bcrypt hash, sensitive fields are excluded from the response, and a `409 Conflict` is returned when the email is already registered.

#### Scenario: API responses leaking credentials
- **WHEN** any auth or profile endpoint returns user data
- **THEN** the `password` field MUST NOT appear anywhere in the payload (enforced with `class-transformer`).

### Requirement: Session & Refresh Token Rotation
Access tokens are short-lived and stay in in-memory client state. Refresh tokens are persisted hashed, rotated on every use, strictly single-use, and revoked on logout.

#### Scenario: Refreshing an access token
- **WHEN** a client calls `POST /auth/refresh` with a valid refresh token (request body or HttpOnly cookie)
- **THEN** the previous token is invalidated, a new refresh token is issued, and a fresh access token is returned.

#### Scenario: Replay of a consumed refresh token
- **WHEN** a client attempts to use an already-rotated or revoked refresh token
- **THEN** the request is rejected with `401 Unauthorized`.

### Requirement: Client Token Storage by Platform
Web clients MUST keep the refresh token in an HttpOnly, Secure, SameSite cookie and hold the access token in memory only. Mobile clients MUST store the refresh token in `expo-secure-store` and restore the session on bootstrap while the token is still valid. The active platform is selected via the `x-client-platform` request header (`web` by default, `mobile` when present).

### Requirement: Email Verification
Email verification uses single-use tokens with a 24-hour TTL. `GET /auth/verify-email?token=...` performs verification server-side and redirects the browser to a frontend landing page carrying `?status=success|expired|invalid` (one-click flow). `POST /auth/verify-email` remains available for programmatic verification.

#### Scenario: One-click verification from a mail client
- **WHEN** a user clicks the verification link in their email
- **THEN** the token is consumed, the user's `emailVerified` flag is set, and the browser redirects to `${EMAIL_VERIFY_REDIRECT_BASE}/email-verified?status=success`.

#### Scenario: Expired or invalid verification token
- **WHEN** the verification token is expired, already used, or malformed
- **THEN** the user is redirected with `?status=expired` or `?status=invalid` respectively and the email remains unverified.

### Requirement: Password Reset Flow
Password resets use one-time tokens. `POST /auth/password-reset/request` generates the token and emails the reset link; `POST /auth/password-reset/confirm` applies the new password and marks the token as used. Both endpoints are rate-limited (see `api-rate-limiting`).

### Requirement: Brute-Force Protection & Lockout
The API MUST track `failedLoginAttempts` and `lockoutUntil` on the user record and temporarily lock login after repeated failures.

### Requirement: Authenticated Route Guards
Protected routes MUST apply the `JwtAuthGuard`, and the authenticated principal MUST be extracted via the `@GetCurrentUser()` decorator into the strongly typed `ActiveUser` (`{ userId, email }`) derived from `request.user`.

#### Scenario: Accessing `/auth/me`
- **WHEN** a request carries a valid bearer token to `GET /auth/me`
- **THEN** the guard resolves the session and the controller returns the `ActiveUser` payload.
- **WHEN** the token is missing, invalid, or expired
- **THEN** the request is rejected with `401 Unauthorized`.