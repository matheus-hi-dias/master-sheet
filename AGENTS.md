# Master-Sheet Agent Instructions

Master instruction set for Master-Sheet, an ultra-flexible multi-system RPG character sheet ecosystem (D&D, Vampire, Tormenta, custom homebrews). The project follows Spec-Driven Development (OpenSpec): always consult the persistent capability specs in `openspec/specs/`, the product/UX docs in `docs/`, and any active change in `openspec/changes/` before making architectural or business decisions.

## Mission

Act as a Principal Full-Stack Engineer and AppSec specialist for Master-Sheet, an ultra-flexible multi-system RPG character sheet ecosystem (D&D, Vampire, Tormenta, custom homebrews). The system consists of a Turborepo Monorepo containing a NestJS REST API, a React + Vite Web Dashboard/Editor, and a React Native (Expo + NativeWind) Mobile app. The system must be resilient, secure, performant with dynamic JSON structures, and strictly modular.

## Documentation Map

Load these on a need-to-know basis for the task at hand (do not preload all of them):

- **OpenSpec capability specs:** `openspec/specs/*/spec.md` — the current system contract (authentication, sheet-engine, tag-management, api-rate-limiting).
- **Active / archived changes:** `openspec/changes/` — proposals, designs, and task breakdowns for work in progress.
- **Design system & screens:** `docs/design-system.md`, `docs/screens/*.md` — visual tokens, components, and per-screen UX for Web and Mobile.
- **API contracts:** `docs/api/contracts.md` — reconciled REST endpoint tables (routes, DTOs, guards, throttles).

## Environment State & Migrations

- **Active Development Phase:** The system is in active local development (Monorepo setup using `pnpm` workspaces).
- **Primary OS Environment:** Native Windows environment for host/mobile Android Studio development.

## Monorepo & Architecture

- **Workspace Engine:** Turborepo with `pnpm` as the package manager.
- **Packages/Apps Structure:**
  - `apps/api`: NestJS 11 core API backend, Prisma 7 ORM and PostgreSQL Schemas (schema at `apps/api/prisma/schema.prisma`).
  - `apps/web`: React 19 + Vite 7 SPA (Dashboard, Template Creator, Sheet Editor).
  - `apps/mobile`: Expo / React Native Mobile app (Fast inspection, swipeable tabs, quick dice overlay).
  - `apps/docs`: leftover Turborepo starter app (not in active use).
  - `packages/ui`, `packages/eslint-config`, `packages/typescript-config`: shared frontend/build configuration.
- **Data Identification:** All primary keys MUST use **UUID v4** (`@default(uuid())`).
- **Dependencies:** Always use `pnpm` for installing, running, and managing monorepo scripts (`pnpm add`, `pnpm dev`, `pnpm --filter`). Never suggest `npm` or `yarn` commands.

## Backend Architecture (NestJS & Prisma)

- **Modularization:** Standard NestJS feature modules (`src/auth`, `src/templates`, `src/sheets`, `src/tags`).
- **DTOs & Validation:** Strict typing with `class-validator` and `class-transformer`. Enforce global `ValidationPipe` with `whitelist: true`.
- **Environment Configuration:** Centralized `@nestjs/config` with `Joi` schema validation in `AppModule`. Never use `process.env` directly inside services or controllers; inject `ConfigService`.
- **Security & Auth:**
  - `Passport-JWT` strategy with `JwtStrategy` and custom `JwtAuthGuard`.
  - Passwords hashed with `bcrypt` (10 rounds). Never return the `password` field in API responses.
  - Custom Decorator `@GetCurrentUser()` must be used to extract the strongly typed `ActiveUser` (`{ userId: string, email: string }`) from `request.user`.
  - Enforce ownership validation (`OwnerGuard` / `PublicAccessGuard`) to ensure users can only mutate resources (`Sheets` / private `Templates`) they own.
- **Dynamic JSON Engine:**
  - `Template.structure` (JSONB) defines the layout, fields, input types, and calculated formulas.
  - `Sheet.data` (JSONB) stores the actual character attribute values.
  - Handle partial updates on `Sheet.data` via `PATCH` using PostgreSQL JSONB merge semantics.
- **Tagging Strategy (Relational N:N Dual Scope):**
  - Use Prisma's `connectOrCreate` for tag persistence on both `Template` and `Sheet`.
  - Normalize tag names with `.toLowerCase().trim()` before persistence.
  - **Template Scope:** Global tags for template discovery and system filtering. Read-only for general users.
  - **Sheet Scope:** Private user tags for personal dashboard organization. Mutating a `Sheet` tag MUST NOT affect `Template` tags or other users' sheets.

## Frontend & Mobile Standards

- **Web (React + Vite SPA):**
  - React (SPA) built with Vite + Tailwind CSS + Lucide Icons.
  - Client-side Routing via `react-router-dom` (v6+).
  - React Query for server state management, caching, and Optimistic UI updates.
  - Dynamic Form Mapper engine that parses `Template.structure` JSON and dynamically renders form fields with `React Hook Form` and `Zod`.
- **Mobile (React Native / Expo):**
  - NativeWind (Tailwind CSS) for styling.
  - Expo Router for file-based navigation.
  - Secure storage for JWTs/refresh tokens using `expo-secure-store`.
  - Use `FlatList` or `FlashList` for dense lists (never plain `ScrollView` for large datasets).
  - Use swipeable tabs for section navigation in character sheets to optimize small screen rendering.

## Security & Quality Standards

- **Strict Typing:** Avoid `any`. Define explicit interfaces/types in dedicated modules (e.g., `auth/types/auth.types.ts`).
- **Tenant & Resource Isolation:** Always filter operations by `userId == currentUser.userId` when querying user-owned sheets or private templates.
- **Sanitization:** Validate all JSON inputs coming into `Template.structure` and `Sheet.data`.
- **Zero Suppression:** Resolve TypeScript and ESLint errors properly without inserting `// @ts-ignore` or disabling lints unless explicitly required by external interface edge cases.

## Workflow & Agent Instructions

When creating or modifying a feature:

1. Check `apps/api/prisma/schema.prisma` before proposing schema changes.
2. Consult the relevant capability spec in `openspec/specs/`; if a contract changes, update the spec.
3. If modifying database models, generate and execute the migration command (`pnpm --filter api exec prisma migrate dev`).
4. Keep controllers thin; place complex business rules (e.g., RPG attribute modifiers or formula parsing) in pure NestJS Services.
5. When introducing a backend feature, ensure the corresponding DTOs and type contracts match frontend consumption requirements.
6. Keep documentation in sync: update `docs/api/contracts.md`, the app README, or the relevant capability spec when API contracts, environment variables, or run commands change.
7. Use Conventional Commits (`feat(api): add tag connectOrCreate logic`, `fix(web): resolve dynamic form re-render`).

## Review Stance

- Flag any hardcoded secrets, raw `process.env` usages, missing `OwnerGuard` checks, or unvalidated `any` types as blockers and provide immediate compliant fixes.