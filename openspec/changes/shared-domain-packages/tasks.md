## 1. Characterization Baseline

- [ ] 1.1 Build a fixture corpus of formula expressions, input value maps, and expected outputs covering both copies (`apps/web/src/lib/formula.ts`, `apps/mobile/lib/formula.ts`) and the API util
- [ ] 1.2 Include error cases: missing dependency, non-numeric dependency, divide-by-zero, unknown function, malformed expression, circular dependency
- [ ] 1.3 Record where the three implementations disagree and adopt the API behavior as canonical (document each divergence)
- [ ] 1.4 Add the corpus as JSON fixtures under `packages/sheet-engine/test/fixtures/`

## 2. Scaffold `@master-sheet/contracts`

- [ ] 2.1 Create `packages/contracts` with `package.json`, `tsconfig.json` extending the shared base, and CJS build to `dist`
- [ ] 2.2 Define the template DSL schema (tabs, sections, field variants, formulas, dependencies, systems, field types) with Zod
- [ ] 2.3 Define the sheet data payload schema and tag shapes
- [ ] 2.4 Define request/response envelope types for template, sheet, tag, and auth endpoints
- [ ] 2.5 Export inferred types and a stable `Issue` code enum from the package root with subpath exports
- [ ] 2.6 Add unit tests for schema acceptance/rejection parity cases
- [ ] 2.7 Port `defaultFieldValue`, `buildDefaultValues`, `buildItemDefaults`, and `structureDefaultValues` into `contracts` from the duplicated `defaults.ts` files
- [ ] 2.8 Port `toNumber` and `toStringValue` coercion into `contracts` and add characterization tests for both default construction and coercion

## 3. Scaffold `@master-sheet/sheet-engine`

- [ ] 3.1 Create `packages/sheet-engine` depending only on `@master-sheet/contracts`, CJS build to `dist`, subpath exports (`/formula`, `/validation`)
- [ ] 3.2 Implement `parseFormula`, `collectDependencies`, and `evaluateFormula` using an AST/interpreter (no `eval`, no `new Function`)
- [ ] 3.3 Implement `buildDependencyGraph`, `detectCycles`, and `evaluateStructure` with topological ordering
- [ ] 3.4 Implement `validateTemplateStructure` and `validateSheetData` returning `ValidationResult` with field paths and stable issue codes
- [ ] 3.5 Make the characterization corpus pass without modifying expected outputs
- [ ] 3.6 Add a boundary test asserting the package source imports no `node:*`, `fs`, `path`, `window`, `document`, `react-native`, or `@nestjs/*`

## 4. Build and Task Graph Wiring

- [ ] 4.1 Add `build`, `lint`, `check-types`, and `test` scripts to both new packages
- [ ] 4.2 Update `turbo.json` so apps depend on the shared packages' builds (`dependsOn: ["^build"]` plus explicit `test` inputs)
- [ ] 4.3 Declare workspace dependencies in `apps/api`, `apps/web`, and `apps/mobile` (`workspace:*`)
- [ ] 4.4 Pin a single `zod` version across the workspace and verify only one copy resolves (`pnpm why zod`)

## 5. Migrate the API (source of truth first)

- [ ] 5.1 Replace structural validation of `Template.structure` with `validateTemplateStructure` via a thin `ZodValidationPipe`
- [ ] 5.2 Replace structural validation of `Sheet.data` with `validateSheetData` before persistence
- [ ] 5.3 Replace formula evaluation with `@master-sheet/sheet-engine` and delete `apps/api/src/templates/utils/formula.util.ts`
- [ ] 5.4 Map shared validation issues to HTTP 400 responses with field paths and issue codes
- [ ] 5.5 Type template/sheet response DTOs from the shared contracts and remove duplicated shape declarations
- [ ] 5.6 Run API unit and e2e tests; confirm JSONB partial-update and calculated-field behavior are unchanged

## 6. Migrate the Web App

- [ ] 6.1 Replace `apps/web/src/features/templates/types/template-structure.ts` with imports from `@master-sheet/contracts`
- [ ] 6.2 Replace `apps/web/src/lib/formula.ts` with `@master-sheet/sheet-engine/formula` and delete the local file
- [ ] 6.3 Reuse `validateSheetData`/`validateTemplateStructure` in the React Hook Form resolver and builder validation
- [ ] 6.4 Replace local sheet types in `features/sheets/types/sheet.types.ts` with shared types
- [ ] 6.5 Type `lib/api.ts` and `services/api.ts` against the shared envelopes
- [ ] 6.6 Delete `apps/web/src/features/sheets/lib/defaults.ts` and consume shared default/coercion helpers
- [ ] 6.7 Run web tests and manually verify builder + editor formula previews against the fixtures

## 7. Migrate the Mobile App

- [ ] 7.1 Replace `apps/mobile/types/template.ts` with imports from `@master-sheet/contracts`
- [ ] 7.2 Replace `apps/mobile/lib/formula.ts` with `@master-sheet/sheet-engine/formula` and delete the local file
- [ ] 7.3 Reuse shared validation in the mobile sheet editor and template screens
- [ ] 7.4 Type `apps/mobile/services/api.ts` against the shared envelopes
- [ ] 7.5 Delete `apps/mobile/lib/defaults.ts` and consume shared default/coercion helpers
- [ ] 7.6 Verify the Metro bundle resolves both packages (CJS + subpath exports) and that formulas compute identically on device/emulator

## 8. Enforce Boundaries and Remove Duplication

- [ ] 8.1 Add the CI boundary script that rejects application-to-application imports and forbidden platform imports in shared packages
- [ ] 8.2 Add `no-restricted-imports` rules to the shared ESLint config for cross-app imports
- [ ] 8.3 Confirm no duplicate formula, template-type, or sheet-validation implementation remains (`rg` for formula/type definitions in `apps/`)
- [ ] 8.4 Confirm `@master-sheet/contracts` has no dependency on `@master-sheet/sheet-engine` or any app

## 9. Documentation and Spec Sync

- [ ] 9.1 Update `docs/api/contracts.md` to reference the shared schemas and envelopes
- [ ] 9.2 Update the architecture notes in `AGENTS.md` to list the new packages and dependency direction
- [ ] 9.3 Confirm the `template-schema-engine` and `sheet-engine` spec deltas match the implemented behavior

## 10. Verification

- [ ] 10.1 Run `pnpm lint && pnpm check-types && pnpm test && pnpm build` across the workspace
- [ ] 10.2 Run the characterization corpus against the built packages in Node and confirm zero mismatches
- [ ] 10.3 Verify a deliberate contract change (add a required field) breaks typecheck in all consumer apps
- [ ] 10.4 Re-run `openspec validate shared-domain-packages --type change --strict`
