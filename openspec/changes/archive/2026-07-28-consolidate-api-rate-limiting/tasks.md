## 1. NestJS Throttler Module Configuration

- [x] 1.1 Update `app.module.ts` to configure named throttler sets (`default`, `strictAuth`, `passwordReset`, `tokenRefresh`) in `ThrottlerModule.forRoot()`.

## 2. Controller Annotations & Route Hardening

- [x] 2.1 Add `@Throttle()` decorators to sensitive auth endpoints in `auth.controller.ts` (`login`, `register`, `refresh`, `logout`, `verify-email`, `password-reset/request`).

## 3. Main Entrypoint Cleanup & Dependency Removal

- [x] 3.1 Remove imperative `express-rate-limit` middleware definitions and `app.use()` calls from `main.ts`.
- [x] 3.2 Remove `express-rate-limit` from `apps/api/package.json` dependencies and `pnpm-lock.yaml`.

## 4. Verification & Testing

- [x] 4.1 Run unit and integration tests (`pnpm --filter api test`) to ensure clean compilation and test execution.
- [x] 4.2 Verify HTTP 429 response formatting across throttled endpoints.
