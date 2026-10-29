## Why

The monorepo currently has the shape of a correct Turborepo workspace but not the guarantees. CI reports four green checks while `apps/mobile` implements none of the evaluated tasks, `check-types` effectively runs only for `@repo/ui`, and the shared `packages/*` are consumed by no app. Meanwhile the repo still carries the `create-turbo` starter: an empty `apps/docs` directory, a UI library incompatible with React Native, Next.js-flavored ESLint/turbo outputs, and a root README describing apps that do not exist. The result is a false sense of safety and three copies of shared logic waiting to drift.

## What Changes

- Make the task contract real: add `lint`, `check-types`, and `test` scripts to `apps/mobile` (or an explicit documented exclusion), add `check-types` to `apps/api` and `apps/web`, and expose root `test`/`check-types` scripts so `pnpm test` matches CI.
- Make CI fail closed: a workspace that declares a task's dependencies but cannot run it must not be silently skipped; declare `test` dependencies for mobile or remove the dead `apps/mobile/__tests__/verify-email.test.tsx` until a runner exists.
- Remove starter residue: delete `apps/docs`, remove the Next.js export/dependency from `@repo/eslint-config`, drop `.next/**` from `turbo.json` outputs, and delete the starter `@repo/ui` (unused and React-DOM-only). The replacement shared UI layer is designed separately in `shared-ui-layer`; this change does not introduce it.
- Remove remaining web starter artifacts (`index.html` title `web`, Vite favicon) while rewriting the root README.
- Turn shared config into real shared config: have `apps/api`, `apps/web`, and `apps/mobile` extend `@repo/typescript-config` and consume `@repo/eslint-config` where applicable, instead of maintaining three independent configs.
- Normalize workspace identity: adopt a single `@master-sheet/*` scope for all apps and packages (or a documented alternative) and apply `private: true` + `version` consistently.
- Fix toolchain hygiene: remove the root `node-linker=hoisted` (keep it only where Metro requires it), add a root Prettier config, wire `prisma generate` into the Turbo graph, remove the obsolete Docker Compose `version:` key and add a DB healthcheck, and collapse the duplicated agent/skill configuration directories to one source of truth.
- Replace the root README with an accurate product/workspace guide.

## Capabilities

### New Capabilities

- `monorepo-toolchain`: Defines the workspace contract — which tasks each workspace must implement, how shared configs are consumed, how packages are named/scoped, and the rule that CI must not report success for work it did not perform.

### Modified Capabilities

<!-- None. No domain/runtime behavior in openspec/specs/ changes; this is workspace infrastructure. -->

## Impact

- Build/CI: `turbo.json`, `package.json` scripts, `.github/workflows/ci.yml`, root/workspace `tsconfig` and ESLint configs, `.npmrc`, `.prettierrc`.
- Workspaces: `apps/mobile` (new scripts/tooling), `apps/api` and `apps/web` (typecheck scripts, config inheritance), `packages/ui` (delete or web-scope), `packages/eslint-config`, `packages/typescript-config`.
- Removal: `apps/docs` local directory, Next.js ESLint export, `.next` build outputs.
- Docs: root `README.md`, `.agent` / `.github/skills` / `.opencode` duplication, `docs/` references if any point at removed packages.
- Risk: renaming workspace package names touches `pnpm --filter` invocations (including CI and Dependabot paths); this is a **BREAKING** workflow change for contributors' muscle memory, not for the public API.
