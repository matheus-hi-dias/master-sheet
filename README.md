# Master-Sheet

Master-Sheet is a multi-system RPG character sheet ecosystem for D&D, Vampire, Tormenta, and custom homebrews. A NestJS API owns authentication and the dynamic template/sheet data model; a React web app and an Expo mobile app render the same JSON-defined sheets on their respective platforms.

The repository follows Spec-Driven Development. Current contracts live in `openspec/specs/`, product and UX decisions live in `docs/`, and in-progress work is tracked under `openspec/changes/`.

## Workspace map

| Workspace                    | Package                           | Stack                                                                         |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| `apps/api`                   | `@master-sheet/api`               | NestJS 11, Prisma 7, PostgreSQL, Passport-JWT, Jest 30                        |
| `apps/web`                   | `@master-sheet/web`               | React 19, Vite 7, Tailwind CSS 4, React Query, React Hook Form + Zod, Jest 29 |
| `apps/mobile`                | `@master-sheet/mobile`            | Expo 55, React Native 0.83, NativeWind, Expo Router, jest-expo / Jest 29      |
| `packages/eslint-config`     | `@master-sheet/eslint-config`     | Shared ESLint flat configs (`base`, `react-internal`)                         |
| `packages/typescript-config` | `@master-sheet/typescript-config` | Shared TypeScript bases (`base`, `react-app`, `react-library`)                |

All workspaces are private and use the `@master-sheet/*` scope.

## Prerequisites

- Node.js 20 or newer (CI runs Node 20; local `.nvmrc` is not used)
- pnpm 9 (`corepack enable` picks up the version pinned in `package.json`)
- Docker Desktop or another Docker runtime for the local PostgreSQL container

## Setup

```bash
corepack enable
pnpm install
```

Create the environment files from their examples:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Fill `apps/api/.env` with a `DATABASE_URL`, a strong `JWT_SECRET`, and the SMTP/URL values you need. The root `.env` only feeds the PostgreSQL container.

Start the database and apply migrations:

```bash
docker compose up -d db
pnpm --filter @master-sheet/api exec prisma migrate dev
```

Run the apps:

```bash
pnpm dev
```

The API listens on `http://localhost:3000`, the web app on `http://localhost:5173`, and Expo prints its own dev-server URL.

## Environment files

| File               | Purpose                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env`             | Docker Compose PostgreSQL credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`).                                           |
| `apps/api/.env`    | API runtime: `DATABASE_URL`, `JWT_SECRET`, token TTLs, `APP_URL`, `FRONTEND_URL`, email verification redirects, SMTP, CORS origins, `PORT`, `NODE_ENV`. |
| `apps/mobile/.env` | `EXPO_PUBLIC_API_URL` for the mobile client (use `http://10.0.2.2:3000` from the Android emulator).                                                     |

## Root tasks

| Command                 | What it does                                                               |
| ----------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`              | Runs the persistent dev tasks for every app through Turbo.                 |
| `pnpm build`            | Builds `@master-sheet/api` and `@master-sheet/web`; mobile builds via EAS. |
| `pnpm lint`             | Runs ESLint in every workspace.                                            |
| `pnpm check-types`      | Runs `tsc --noEmit` in every workspace.                                    |
| `pnpm test`             | Runs Jest in every workspace.                                              |
| `pnpm format`           | Formats `ts`, `tsx`, `md`, and `json` with the root Prettier config.       |
| `pnpm format:check`     | Fails if any file is not formatted with the root Prettier config.          |
| `pnpm verify:workspace` | Fails if a workspace is missing a required task or a `package.json`.       |

Target a single workspace with its scoped name, for example:

```bash
pnpm --filter @master-sheet/api test
pnpm --filter @master-sheet/web dev
pnpm --filter @master-sheet/mobile start
```

Prisma client generation is part of the Turbo graph: `@master-sheet/api#build` and `@master-sheet/api#check-types` depend on the uncached `db:generate` task. `postinstall` also generates the client for editor/IDE convenience.

## Workspace conventions

- **Scope:** every manifest uses `@master-sheet/*`; all packages are private.
- **Task contract:** every app implements `lint`, `check-types`, and `test`. `build` is required for `api` and `web`; `mobile` is exempt because native binaries are produced by EAS/Expo (`eas build`, `expo run:*`). `scripts/verify-workspace.mjs` enforces this contract and also fails on a workspace directory without a `package.json`.
- **TypeScript:** `packages/typescript-config/base.json` holds the strict shared settings. `react-app.json` adds browser/bundler options for Vite, `react-library.json` adds library emit, the API keeps NestJS overrides (`nodenext`, decorators, `emitDecoratorMetadata`, `outDir`), and mobile extends the shared base first and `expo/tsconfig.base.json` second so Expo wins for Metro-specific resolution.
- **ESLint:** `@master-sheet/eslint-config/base` and `react-internal` are shared. The web app consumes `react-internal`; the API keeps an app-local config because NestJS needs `recommendedTypeChecked`, `projectService`, generated Prisma ignores, and test-double relaxations. The exception is documented in `apps/api/README.md`.
- **Install layout:** the root `pnpm` install is isolated, so each workspace resolves its own tool versions. `apps/mobile/.npmrc` retains `node-linker=hoisted` for Metro-sensitive installs; do not re-enable hoisting at the root, because it allowed the API's Jest 30 to shadow the mobile app's Jest 29.
- **Agent instructions:** `.opencode/` is the canonical source for agent workflows; `.github/` mirrors the same skills/prompts for Copilot users.

## Auth contract

The auth flow is shared across the API, web app, and mobile app with the following rules:

- Access tokens are short-lived and stay in memory only.
- Refresh tokens are rotated on use and revoked on logout.
- The web app stores the refresh token in an HttpOnly, Secure, SameSite cookie.
- The mobile app stores the refresh token in secure device storage and restores sessions on bootstrap when the refresh token is still valid.
- Email verification and password reset links are issued by the API; in development, the mail layer falls back to logging when SMTP is not configured.
- The API rejects expired, revoked, or replayed tokens and applies temporary lockout after repeated failed logins.

### One-click email verification

The system supports a one-click verification flow where the user clicks a link in their email and is automatically verified and redirected to the appropriate landing page.

#### Configuration

- `EMAIL_VERIFY_URL`: the full URL template used in verification emails.
  - **One-click (default):** `${API_URL}/auth/verify-email?token={{token}}`
  - **Frontend-mediated:** `${FRONTEND_URL}/email-verify?token={{token}}`
- `EMAIL_VERIFY_REDIRECT_BASE`: the base URL where the API redirects after verification. Defaults to `FRONTEND_URL` or `APP_URL`.
- `APP_URL`: the base URL of the API.
- `FRONTEND_URL`: the base URL of the web application.

#### Redirect behavior

When a user hits `GET /auth/verify-email?token=...`, the API processes the token and redirects to:

`${EMAIL_VERIFY_REDIRECT_BASE}/email-verified?status=<status>&message=<optional-message>`

Status values:

- `success`: email verified successfully.
- `expired`: token has expired (24h TTL).
- `invalid`: token is invalid, already used, or not found.

## Documentation

- API endpoint tables: [`docs/api/contracts.md`](docs/api/contracts.md)
- Design system and screens: [`docs/design-system.md`](docs/design-system.md), [`docs/screens/`](docs/screens/)
- Capability specs: [`openspec/specs/`](openspec/specs/)
- Active changes: [`openspec/changes/`](openspec/changes/)

## Contributing

Use Conventional Commits (`feat(api): ...`, `fix(web): ...`, `chore(workspace): ...`). Run `pnpm verify:workspace && pnpm lint && pnpm check-types && pnpm test && pnpm build` before opening a pull request.
