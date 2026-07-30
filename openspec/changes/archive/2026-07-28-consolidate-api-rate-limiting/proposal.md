## Why

The `apps/api` application currently runs two redundant rate-limiting mechanisms simultaneously: `@nestjs/throttler` (global NestJS guard) and `express-rate-limit` (mounted per route in `main.ts`). This creates duplicate overhead, conflicting error response formats (plain text vs. NestJS 429 JSON), and bypasses standard NestJS guard decorators. Consolidating into `@nestjs/throttler` unifies rate-limiting configuration and standardizes client error contracts across the API.

## What Changes

- Consolidate all rate limiting logic under NestJS `@nestjs/throttler`.
- Configure named throttler sets (`default`, `strictAuth`, `passwordReset`) in `app.module.ts`.
- Apply `@Throttle()` decorators to sensitive auth endpoints (`login`, `register`, `refresh`, `logout`, `verify-email`, `password-reset/request`) in `auth.controller.ts`.
- Remove manual `express-rate-limit` middleware initializations and mounts from `main.ts`.
- Remove `express-rate-limit` from `apps/api/package.json` dependencies.

## Capabilities

### New Capabilities

- `api-rate-limiting`: Multi-tier rate limiting for NestJS endpoints using `@nestjs/throttler` with consistent JSON error responses and configurable named throttle limits.

### Modified Capabilities

None.

## Impact

- `apps/api/src/main.ts`: Removal of `express-rate-limit` middleware setup.
- `apps/api/src/app.module.ts`: Updated `ThrottlerModule.forRoot` configuration with named throttlers.
- `apps/api/src/auth/auth.controller.ts`: Added `@Throttle()` decorators on auth routes.
- `apps/api/package.json`: Dependency `express-rate-limit` removed.
- Web & Mobile API Clients: Standardized HTTP 429 JSON response structure across all rate-limited endpoints.
