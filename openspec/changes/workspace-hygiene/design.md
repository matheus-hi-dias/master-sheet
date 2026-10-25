## Context

`workspace-hygiene` is a build/configuration change with no runtime domain impact. Current state (verified):

- `apps/mobile` defines only Expo scripts (`start`, `android`, `ios`, `web`) — no `lint`, `test`, `check-types`, or `build`.
- `apps/api` and `apps/web` define `lint`, `test`, `build` but no `check-types`.
- `packages/ui` is the only package with `check-types`; nothing in `apps/*` imports `@repo/ui`, `@repo/eslint-config`, or `@repo/typescript-config` (except `ui` consuming the latter two).
- `apps/api/tsconfig.json` and `apps/web/tsconfig.app.json` define compiler options inline; `apps/mobile/tsconfig.json` extends `expo/tsconfig.base.json`.
- `turbo.json` build outputs include `.next/**`; `@repo/eslint-config` exports `./next-js` and depends on `@next/eslint-plugin-next`; neither is used.
- `apps/docs/` contains only `node_modules/` (not tracked).
- Root README is the `create-turbo` starter text.
- Root `.npmrc` and `apps/mobile/.npmrc` both set `node-linker=hoisted`.
- Prisma client generation happens in `postinstall` and CI, not in the Turbo graph.
- Agent instructions are duplicated across `.agent/`, `.github/{skills,prompts}/`, and `.opencode/{skills,commands}/`.

Constraint: no behavior in `openspec/specs/*` changes. This change must be shippable without touching API DTOs, Prisma schema, or the sheet/template contract.

## Goals / Non-Goals

**Goals:**

- Make every task in `turbo.json` meaningful and actually executed for each app that should run it.
- Make CI fail when a workspace silently lacks a required script.
- Make `packages/*` either genuinely consumed or removed.
- Establish one scope, one TypeScript config chain, one ESLint chain, one Prettier config.
- Remove starter residue and make root docs truthful.

**Non-Goals:**

- Extracting the formula engine or domain contracts (separate change: `shared-domain-packages`).
- Containerizing the API or changing `docker-compose` beyond cleanup.
- Changing runtime behavior, API responses, Prisma schema, or React Native/Web features.
- Adopting Changesets/release versioning (all packages stay private).

## Decisions

### D1 — Standard task contract per workspace

Required scripts: `lint`, `check-types`, `test` for every app; `build` for `api` and `web`; `mobile` documents `build` as an EAS/Expo concern and instead provides `check-types: tsc --noEmit`.

- `api`: `check-types: tsc -p tsconfig.json --noEmit` (fast feedback; `nest build` still owns emit).
- `web`: `check-types: tsc -b --noEmit`? Project references do not accept `--noEmit` with `-b` cleanly; use `tsc -b` (emit disabled in `tsconfig.app.json`) or `tsc -p tsconfig.app.json --noEmit`. Decision: `tsc -p tsconfig.app.json --noEmit`.
- `mobile`: `check-types: tsc --noEmit`, `lint: eslint .`, and a `test` script only once a runner exists. Until then remove the orphan `__tests__/verify-email.test.tsx` or add Jest + testing-library to mobile. Decision: add the runner (Expo preset) so the existing test is real; if that is deferred, the test file is removed rather than shipping dead code.

Alternative considered: rely on `build` to typecheck. Rejected because `build` is slow, deletes `dist`, and mobile has no build task.

### D2 — CI must fail closed

Turborepo does not error when a workspace lacks a task — it skips it. Add `scripts/verify-workspace.mjs` that reads `pnpm-workspace.yaml`, iterates workspace manifests, and asserts the required script set (with an explicit `apps/mobile` build exception). Run it in the `quality` job before `turbo run`. Root also wires it into `pretest`/`prebuild`? Decision: CI-only plus a root `pnpm verify:workspace` script, to avoid slowing local loops.

Alternative considered: `turbo run <task> --only` per app in CI. Rejected: verbose matrix and still silent.

### D3 — One scope: `@master-sheet/*`

Rename `api` → `@master-sheet/api`, `web` → `@master-sheet/web`, `mobile` → `@master-sheet/mobile`; keep `@master-sheet/{ui,eslint-config,typescript-config,contracts,sheet-engine}`. Add `"private": true` and `"version": "0.0.0"` to every manifest.

Alternatives: keep unscoped app names (works, but `pnpm --filter api` ambiguity grows); use `@repo/*` for everything (generic, collides conceptually with the starter). Decision: product scope, because this repo ships one product ecosystem.

Impact: update `pnpm --filter api db:generate` in CI (`.github/actions/setup`), `pnpm-lock.yaml` importer keys, Dependabot paths are directory-based (unaffected), and any docs referencing filters.

### D4 — Delete `apps/docs` and the starter `@repo/ui`

- `apps/docs`: untracked leftover containing only `node_modules`; delete locally. Also add a guard against workspace dirs without `package.json` (D2).
- `@repo/ui`: starter component library (`button`, `card`, `code`) that no app imports and that is React-DOM-only, so it cannot serve mobile. Delete the package and its Dependabot entry.
- Remove `./next-js` export and `@next/eslint-plugin-next` from `@repo/eslint-config`; remove `.next/**` from `turbo.json` outputs.
- This deletion does **not** mean "no shared UI." Real duplication exists in design tokens, font assets, and a handful of primitives; that layer is designed in `shared-ui-layer` and reintroduced as `@master-sheet/{design-tokens,ui}`. Sequencing: deleting the starter is independent and can ship first.

Alternative considered: retarget the starter `@repo/ui` as the shared component source. Rejected because its components predate the design system and because a shared primitive layer needs platform-split files, not a straight move (see `shared-ui-layer`).

### D5 — Shared configs actually consumed

- `@master-sheet/typescript-config`: add a `base.json` suitable for apps (strict, `skipLibCheck`, `ES2023`), a `react-app.json`, and keep `react-library.json`. `api` extends `base.json` and overrides `module`/`moduleResolution: nodenext`, decorators, and `emitDecoratorMetadata`. `web` extends `react-app.json` and keeps Vite-specific `types`/`noEmit`. `mobile` extends `expo/tsconfig.base.json` (Expo owns RN types) and adds shared strict flags via `@master-sheet/typescript-config/base` where compatible.
- `@master-sheet/eslint-config`: expose `base` (TS + prettier) and `react-internal` (web); API keeps its Nest-aware config because Nest's `recommendedTypeChecked` rules and generated-client ignores are app-specific. Document the API exception in the spec.

Decision: don't force a single ESLint config on Nest; forcing it would require duplicating the same overrides anyway.

### D6 — Toolchain hygiene

- Remove root `node-linker=hoisted`; keep `apps/mobile/.npmrc` (Metro). This may surface phantom dependencies; the migration task is to declare them per package rather than re-enable hoisting globally.
- Add root `.prettierrc.json`; delete `apps/api/.prettierrc` (or reduce it to overrides if Nest needs different print width). Root `format` script then covers `ts/tsx/md/json`.
- Turbo: add `db:generate` task (`cache: false`, `inputs: ["prisma/**"]`, `outputs: ["src/generated/**"]`) and make `api#build` and `api#check-types` depend on it. Keep `postinstall` for editor/IDE convenience.
- `docker-compose.yml`: drop obsolete `version:`, add `healthcheck: pg_isready -U $POSTGRES_USER -d $POSTGRES_DB`, keep `db` only.
- Agent config: choose `.opencode/` as the working tool source and `.github/` (Copilot) as a mirror; delete `.agent/` if no tool reads it, or document it as the canonical source that the others mirror. Decision: delete `.agent/` and note `.opencode/` as canonical in the README.

### D7 — Truthful root README

Rewrite as: product summary, workspace map, prerequisites, env setup (root `.env` for Postgres, `apps/api/.env`, `apps/mobile/.env`), task table, and the _existing_ auth contract section. Remove all `create-turbo` text and Next.js references.

## Risks / Trade-offs

- **[Removing root hoisting breaks installs]** → Run `pnpm install` and `pnpm build` in a clean checkout; add missing dependencies explicitly. Keep `apps/mobile` hoisted because Metro requires it.
- **[Renaming filters breaks CI/scripts]** → Grep for `--filter (api|web|mobile)` and update `.github`, `package.json`, docs in the same commit; verify with `pnpm -r exec pwd`.
- **[Deleting `@repo/ui` loses a future shared library]** → It is unused, predates the design system, and is RN-incompatible. The replacement is planned in `shared-ui-layer` as `@master-sheet/design-tokens` plus a selectively shared `@master-sheet/ui`; deleting the starter does not block that work.
- **[Mobile test runner adds native deps/complexity]** → Prefer `jest-expo` with the existing single test; if setup cost is high, delete the orphan test and add a follow-up task rather than shipping a fake `test` script.
- **[Strict node_modules reveals more than expected]** → Time-box the fix; if it cascades, revert only the root `.npmrc` change and keep the rest of the change.

## Migration Plan

1. Land script/config/manifest changes without renaming filters first (add scripts, remove dead config).
2. Rename scopes + update filters/lockfile in one commit; run `pnpm install` to refresh importers.
3. Delete `apps/docs`, `@repo/ui`, Next exports, `.next` outputs.
4. Flip root `.npmrc`, fix surfaced deps, run full `pnpm lint && pnpm check-types && pnpm test && pnpm build`.
5. Rewrite README and consolidate agent config.
6. Rollback: revert the relevant commit; no data or schema migration is involved.
