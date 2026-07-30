## Context

`apps/api` has been running two rate limiters concurrently:
1. `express-rate-limit` middleware initialized imperatively in `main.ts` for `/auth/*` endpoints.
2. `@nestjs/throttler` initialized globally as `APP_GUARD` in `app.module.ts`.

This dual setup creates redundant memory consumption, dual header management, and inconsistent HTTP 429 response structures.

## Goals / Non-Goals

**Goals:**
- Unify all API rate limiting under `@nestjs/throttler`.
- Configure named throttler sets (`default`, `strictAuth`, `passwordReset`) in `app.module.ts`.
- Declaratively apply `@Throttle()` decorators on sensitive endpoints in `auth.controller.ts`.
- Ensure standard NestJS 429 JSON response payload structure across all endpoints.
- Remove `express-rate-limit` dependency from `package.json` and `main.ts`.

**Non-Goals:**
- Installing Redis/external stores for distributed rate limiting (in-memory rate storage remains suitable for current single-instance deployment).

## Decisions

### 1. Throttler Configuration in `AppModule`
We will configure `@nestjs/throttler` with named sets in `app.module.ts`:
- `default`: 120 requests / 60s (for general API routes)
- `strictAuth`: 5 requests / 60s (for login, register, verify-email)
- `passwordReset`: 3 requests / 3600s (for password reset requests)
- `tokenRefresh`: 60 requests / 60s (for refresh token rotation)

Rationale: Using named throttlers native to `@nestjs/throttler` v6 enables granular route limits while leveraging a single unified guard engine.

### 2. Removal of `express-rate-limit`
All route limiters mounted in `main.ts` (`loginLimiter`, `registerLimiter`, `refreshLimiter`, etc.) will be deleted along with the `express-rate-limit` dependency.

Rationale: Removes 1 external package dependency and eliminates duplicate request parsing overhead.

## Risks / Trade-offs

- [Risk] Rate limit breach format changes from plain string to standard NestJS JSON (`{ "statusCode": 429, "message": "Throttled" }`).
  → Mitigation: Standard NestJS JSON format is cleaner and easier for Web and Mobile HTTP clients to parse uniformly.

## Migration Plan

1. Update `app.module.ts` to define named throttlers.
2. Update `auth.controller.ts` with `@Throttle()` decorators matching target rate tiers.
3. Clean up `main.ts` express middleware setup.
4. Remove `express-rate-limit` from `package.json`.
5. Run unit/integration tests (`pnpm --filter api test`) to verify clean compilation and passing tests.
