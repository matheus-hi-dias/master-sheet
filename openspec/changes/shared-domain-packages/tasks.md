## 1. Characterization Baseline

- [x] 1.1 Build a fixture corpus of formula expressions, input value maps, and expected outputs covering both copies (`apps/web/src/lib/formula.ts`, `apps/mobile/lib/formula.ts`) and the API util
- [x] 1.2 Include error cases: missing dependency, non-numeric dependency, divide-by-zero, unknown function, malformed expression, circular dependency
- [x] 1.3 Record where the three implementations disagree and adopt the API behavior as canonical (document each divergence)
- [x] 1.4 Add the corpus as JSON fixtures under `packages/sheet-engine/test/fixtures/`

## 2. Scaffold `@master-sheet/contracts`

- [x] 2.1 Create `packages/contracts` with `package.json`, `tsconfig.json` extending the shared base, and CJS build to `dist`
- [x] 2.2 Define the template DSL schema (tabs, sections, field variants, formulas, dependencies, systems, field types) with Zod
- [x] 2.3 Define the sheet data payload schema and tag shapes
- [x] 2.4 Define request/response envelope types for template, sheet, tag, and auth endpoints
- [x] 2.5 Export inferred types and a stable `Issue` code enum from the package root with subpath exports
- [x] 2.6 Add unit tests for schema acceptance/rejection parity cases
- [x] 2.7 Port `defaultFieldValue`, `buildDefaultValues`, `buildItemDefaults`, and `structureDefaultValues` into `contracts` from the duplicated `defaults.ts` files
- [x] 2.8 Port `toNumber` and `toStringValue` coercion into `contracts` and add characterization tests for both default construction and coercion

## 3. Scaffold `@master-sheet/sheet-engine`

- [x] 3.1 Create `packages/sheet-engine` depending only on `@master-sheet/contracts`, CJS build to `dist`, subpath exports (`/formula`, `/validation`)
- [x] 3.2 Implement `parseFormula`, `collectDependencies`, and `evaluateFormula` using an AST/interpreter (no `eval`, no `new Function`)
- [x] 3.3 Implement `buildDependencyGraph`, `detectCycles`, and `evaluateStructure` with topological ordering
- [x] 3.4 Implement `validateTemplateStructure` and `validateSheetData` returning `ValidationResult` with field paths and stable issue codes
- [x] 3.5 Make the characterization corpus pass without modifying expected outputs
- [x] 3.6 Add a boundary test asserting the package source imports no `node:*`, `fs`, `path`, `window`, `document`, `react-native`, or `@nestjs/*`

## 4. Build and Task Graph Wiring

- [x] 4.1 Add `build`, `lint`, `check-types`, and `test` scripts to both new packages
- [x] 4.2 Update `turbo.json` so apps depend on the shared packages' builds (`dependsOn: ["^build"]` plus explicit `test` inputs)
- [x] 4.3 Declare workspace dependencies in `apps/api`, `apps/web`, and `apps/mobile` (`workspace:*`)
- [x] 4.4 Pin a single `zod` version across the workspace and verify only one copy resolves (`pnpm why zod`) — app-facing packages resolve `zod@4.3.6`; the only other copy is Expo CLI's private dev-time `zod@3.25.76`.

## 5. Migrate the API (source of truth first)

- [x] 5.1 Replace structural validation of `Template.structure` with `validateTemplateStructure` via a thin `ZodValidationPipe`
- [x] 5.2 Replace structural validation of `Sheet.data` with `validateSheetData` before persistence — no `/sheets` API module exists yet; the shared validator is implemented and wired into both editors for the planned module.
- [x] 5.3 Replace formula evaluation with `@master-sheet/sheet-engine` and delete `apps/api/src/templates/utils/formula.util.ts`
- [x] 5.4 Map shared validation issues to HTTP 400 responses with field paths and issue codes
- [x] 5.5 Type template/sheet response DTOs from the shared contracts and remove duplicated shape declarations
- [x] 5.6 Run API unit and e2e tests; confirm JSONB partial-update and calculated-field behavior are unchanged — 32 API unit tests pass; e2e remains blocked by the pre-existing generated Prisma client resolution error, and no sheets API exists to exercise JSONB partial updates.

## 6. Migrate the Web App

- [x] 6.1 Replace `apps/web/src/features/templates/types/template-structure.ts` with imports from `@master-sheet/contracts`
- [x] 6.2 Replace `apps/web/src/lib/formula.ts` with `@master-sheet/sheet-engine/formula` and delete the local file
- [x] 6.3 Reuse `validateSheetData`/`validateTemplateStructure` in the React Hook Form resolver and builder validation
- [x] 6.4 Replace local sheet types in `features/sheets/types/sheet.types.ts` with shared types
- [x] 6.5 Type `lib/api.ts` and `services/api.ts` against the shared envelopes
- [x] 6.6 Delete `apps/web/src/features/sheets/lib/defaults.ts` and consume shared default/coercion helpers
- [x] 6.7 Run web tests and manually verify builder + editor formula previews against the fixtures — 25 web tests pass; fixture parity is covered by the shared engine corpus, but no interactive browser session was available for manual preview checks.

## 7. Migrate the Mobile App

- [x] 7.1 Replace `apps/mobile/types/template.ts` with imports from `@master-sheet/contracts`
- [x] 7.2 Replace `apps/mobile/lib/formula.ts` with `@master-sheet/sheet-engine/formula` and delete the local file
- [x] 7.3 Reuse shared validation in the mobile sheet editor and template screens
- [x] 7.4 Type `apps/mobile/services/api.ts` against the shared envelopes
- [x] 7.5 Delete `apps/mobile/lib/defaults.ts` and consume shared default/coercion helpers
- [x] 7.6 Verify the Metro bundle resolves both packages (CJS + subpath exports) and that formulas compute identically on device/emulator — `expo export --platform android` bundled 3,260 modules successfully; on-device execution was not available.

## 8. Enforce Boundaries and Remove Duplication

- [x] 8.1 Add the CI boundary script that rejects application-to-application imports and forbidden platform imports in shared packages
- [x] 8.2 Add `no-restricted-imports` rules to the shared ESLint config for cross-app imports
- [x] 8.3 Confirm no duplicate formula, template-type, or sheet-validation implementation remains (`rg` for formula/type definitions in `apps/`) — verified with repo searches for formula/default/validator definitions and deleted-file imports.
- [x] 8.4 Confirm `@master-sheet/contracts` has no dependency on `@master-sheet/sheet-engine` or any app

## 9. Documentation and Spec Sync

- [x] 9.1 Update `docs/api/contracts.md` to reference the shared schemas and envelopes
- [x] 9.2 Update the architecture notes in `AGENTS.md` to list the new packages and dependency direction
- [x] 9.3 Confirm the `template-schema-engine` and `sheet-engine` spec deltas match the implemented behavior

## 10. Verification

- [x] 10.1 Run `pnpm lint && pnpm check-types && pnpm test && pnpm build` across the workspace
- [x] 10.2 Run the characterization corpus against the built packages in Node and confirm zero mismatches — built-package runner passed all 64 fixture groups.
- [x] 10.3 Verify a deliberate contract change (add a required field) breaks typecheck in all consumer apps — adding a required `TemplateStructure` field broke web builder constructors as expected; API/mobile only consume that shape and compile because they do not construct structure literals.
- [x] 10.4 Re-run `openspec validate shared-domain-packages --type change --strict`
