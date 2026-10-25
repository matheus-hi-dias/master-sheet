## 1. Baseline and Safety Net

- [ ] 1.1 Record the current task coverage matrix (`pnpm -r exec node -e "..."` or a temporary script) for `lint`, `build`, `test`, `check-types` across `apps/*` and `packages/*`
- [ ] 1.2 Run `pnpm install`, `pnpm lint`, `pnpm build`, `pnpm test` and save the baseline results before any change
- [ ] 1.3 Document the `apps/mobile` build exemption decision in `apps/mobile/README.md`

## 2. Uniform Task Contract

- [ ] 2.1 Add `check-types` to `apps/api` (`tsc -p tsconfig.json --noEmit`) and verify it passes
- [ ] 2.2 Add `check-types` to `apps/web` (`tsc -p tsconfig.app.json --noEmit`) and verify it passes
- [ ] 2.3 Add `lint` to `apps/mobile` with a flat ESLint config compatible with Expo/React Native, and verify it passes
- [ ] 2.4 Add `check-types` to `apps/mobile` (`tsc --noEmit`) and fix any surfaced type errors
- [ ] 2.5 Add a real `test` runner to `apps/mobile` (jest-expo + testing-library) and make `__tests__/verify-email.test.tsx` pass, or delete the orphan test and leave `test` out of the contract for mobile
- [ ] 2.6 Add root `test` and `check-types` scripts that proxy the Turbo tasks
- [ ] 2.7 Run `pnpm turbo run lint check-types test build` and confirm every app executes its required tasks

## 3. Fail-Closed CI Verification

- [ ] 3.1 Add `scripts/verify-workspace.mjs` that reads `pnpm-workspace.yaml`, parses each workspace `package.json`, and asserts the required script set (mobile exempt from `build`)
- [ ] 3.2 Make the script also fail on workspace directories without a `package.json`
- [ ] 3.3 Add a root `verify:workspace` script and run it before `turbo run` in `.github/workflows/ci.yml`
- [ ] 3.4 Add a deliberate broken-manifest test locally (temporary) to confirm the guard fails, then revert

## 4. Shared Configuration Is Consumed

- [ ] 4.1 Add `base.json` to `@master-sheet/typescript-config` with the common strict settings used by the apps
- [ ] 4.2 Add `react-app.json` to `@master-sheet/typescript-config` and have `apps/web/tsconfig.app.json` extend it, keeping only Vite-specific overrides
- [ ] 4.3 Have `apps/api/tsconfig.json` extend the shared base and keep only NestJS overrides (`nodenext`, decorators, `emitDecoratorMetadata`, `outDir`)
- [ ] 4.4 Have `apps/mobile/tsconfig.json` extend both `expo/tsconfig.base.json` and the shared strict base where compatible, and document any incompatibility
- [ ] 4.5 Have `apps/web` consume `@master-sheet/eslint-config/react-internal`; keep API's Nest-specific ESLint config and document the exception in `apps/api/README.md`
- [ ] 4.6 Verify `pnpm check-types` and `pnpm lint` still pass after inheritance changes

## 5. Remove Starter Residue

- [ ] 5.1 Delete the local `apps/docs` directory (contains only `node_modules`)
- [ ] 5.2 Delete `packages/ui` and remove its Dependabot entry from `.github/dependabot.yml`
- [ ] 5.3 Remove the `./next-js` export and `@next/eslint-plugin-next` from `packages/eslint-config`
- [ ] 5.4 Remove `.next/**` from `turbo.json` build outputs
- [ ] 5.5 Confirm no source file imports `@repo/ui` or the removed Next.js config before deleting

## 6. Normalize Workspace Identity

- [ ] 6.1 Rename app manifests to `@master-sheet/api`, `@master-sheet/web`, `@master-sheet/mobile` and add `private: true` + `version` to all manifests
- [ ] 6.2 Rename remaining packages to `@master-sheet/{eslint-config,typescript-config}`
- [ ] 6.3 Update every `pnpm --filter` occurrence (including `.github/actions/setup/action.yml` and docs) to the scoped names
- [ ] 6.4 Run `pnpm install` to refresh `pnpm-lock.yaml` importers and confirm no unscoped workspace name remains (`rg --glob '!pnpm-lock.yaml' 'filter (api|web|mobile)'`)

## 7. Toolchain Hygiene

- [ ] 7.1 Remove `node-linker=hoisted` from the root `.npmrc`; keep it in `apps/mobile/.npmrc` and document why
- [ ] 7.2 Run a clean `pnpm install` and declare any newly surfaced phantom dependencies explicitly
- [ ] 7.3 Add a root `.prettierrc.json`, remove `apps/api/.prettierrc`, and confirm `pnpm format` is consistent
- [ ] 7.4 Add a `db:generate` task to `turbo.json` and make `api#build` and `api#check-types` depend on it
- [ ] 7.5 Remove the obsolete `version:` key from `docker-compose.yml` and add a `pg_isready` healthcheck
- [ ] 7.6 Delete `.agent/` (or document it as canonical) so only one agent-instruction source drives `.github/` and `.opencode/`

## 8. Documentation

- [ ] 8.1 Rewrite the root `README.md`: product summary, workspace map, prerequisites, env files (root `.env`, `apps/api/.env`, `apps/mobile/.env`), task table, auth-contract section
- [ ] 8.2 Remove every `create-turbo` and Next.js reference from the root README
- [ ] 8.3 Add a short "workspace conventions" section (scope, task contract, config inheritance) and link it from `AGENTS.md`

## 9. Verification

- [ ] 9.1 Run `pnpm verify:workspace && pnpm lint && pnpm check-types && pnpm test && pnpm build` on a clean checkout
- [ ] 9.2 Confirm CI passes and that removing a script from any app makes `verify:workspace` fail
- [ ] 9.3 Confirm `docker compose up -d db` reports healthy
- [ ] 9.4 Re-run `openspec validate workspace-hygiene --type change --strict`
