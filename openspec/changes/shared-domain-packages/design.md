## Context

The domain is already specified as shared, but implemented three times:

| Concern | API | Web | Mobile |
|---|---|---|---|
| Formula evaluation | `apps/api/src/templates/utils/formula.util.ts` | `apps/web/src/lib/formula.ts` (311 lines) | `apps/mobile/lib/formula.ts` (312 lines) |
| Template DSL types | DTOs in `apps/api/src/templates` | `features/templates/types/template-structure.ts` | `types/template.ts` |
| Sheet data shape | DTOs in `apps/api/src/sheets` | `features/sheets/types/sheet.types.ts` | inferred locally |
| HTTP client | — | `lib/api.ts` + `services/api.ts` | `services/api.ts` |

`openspec/specs/template-schema-engine/spec.md` already states: *"sandboxed formula evaluation shared by every client"*, and `openspec/specs/sheet-engine/spec.md` requires *"structural validation parity"*. Neither is enforceable today. The web copy and mobile copy differ (different hashes), so drift has already started.

Hard constraints:

- React Native/Hermes cannot run DOM or Node APIs, decorators, or `class-validator`.
- `apps/api` is CommonJS (`module: nodenext`, no `"type": "module"`); `apps/web` is ESM/Vite; `apps/mobile` is Metro/Hermes.
- Zod is already a dependency of `apps/web`; `class-validator`/`class-transformer` own HTTP DTO validation in the API.
- Formula semantics must not change during extraction.

## Goals / Non-Goals

**Goals:**

- One implementation of the template DSL schemas, sheet payload schemas, and formula engine, consumed by API, web, and mobile.
- Runtime validation and TypeScript types derived from the same definitions.
- Enforceable platform neutrality (no DOM/Node/RN imports).
- Characterization tests that prove behavior is preserved.

**Non-Goals:**

- Changing the formula language, operators, or supported functions.
- Changing REST endpoints, response envelopes, or the Prisma schema.
- Replacing `class-validator` for simple HTTP DTOs (auth, query params, route params).
- Creating a full SDK/GraphQL client. A unified `api-client` is a follow-up, not part of this change.
- Sharing UI components between web and mobile.

## Decisions

### D1 — Two packages: `contracts` and `sheet-engine`

- `@master-sheet/contracts`: DSL types, Zod schemas, sheet payload schemas, envelope types, shared enums (systems, field types), pure type guards, and canonical field concerns (default values per field type, `buildDefaultValues`/`structureDefaultValues`, and `toNumber`/`toStringValue` coercion). Minimal runtime dependencies (Zod only).
- `@master-sheet/sheet-engine`: formula parser/evaluator, dependency graph, cycle detection, and the validation entry points that compose contracts schemas. Depends on `contracts`.

Rejected alternative: a single `packages/domain`. It would force every consumer of a type to pull in the formula engine (and its tests/bundle), and it muddles the dependency direction. Two packages keep `contracts` importable by anything, including future tooling.

Rejected alternative: a shared `api-client` now. Web and mobile have different auth storage/refresh flows; unifying transport is valuable but orthogonal. This change defines envelope types so a client package can be extracted later without re-typing.

### D2 — Zod is the schema language; API validates JSONB payloads with it

- Author `templateStructureSchema`, `sheetDataSchema`, `tagSchema`, and response/request envelope schemas in `contracts`.
- Types are `z.infer<...>`; no hand-written parallel interfaces.
- API uses the shared schemas for the two JSONB payloads (`Template.structure`, `Sheet.data`) via a thin `ZodValidationPipe`, enforcing the existing "Structural Validation Parity" contract. Simple DTOs (credentials, IDs, pagination) remain `class-validator`.
- Web/mobile use the same schemas in React Hook Form resolvers and pre-submit checks.

Rejected alternative: keep `class-validator` as the source and generate client types. Decorators do not run in RN and codegen adds a build step for no runtime benefit.

Rejected alternative: validate twice on the API (class-validator + Zod). Rejected to avoid divergent error messages; the JSONB boundary is Zod-only.

Field default construction and value coercion (`toNumber`, `toStringValue`) also belong in `contracts`, not `sheet-engine`: they are field-type-driven data rules with no evaluation or dependency graph, and both frontends need them before a form exists. The two existing `defaults.ts` files are identical apart from the mobile-only coercion helpers, so this is a straight port with characterization tests.

### D3 — Formula engine is a pure, dependency-free module

Public surface (names indicative):

- `parseFormula(expression)` → AST or structured error
- `collectDependencies(expression)` → `string[]`
- `evaluateFormula(expression | AST, values)` → `number | null`
- `buildDependencyGraph(structure)` / `detectCycles(graph)` → cycles
- `evaluateStructure(structure, data)` → computed values in topological order

Rules:

- No `eval`, no `new Function`, no `Intl`, no `Date`, no `process`, no `window`.
- Only the function set already specified: `floor`, `ceil`, `round`, `abs`, `min`, `max`.
- Missing/non-numeric dependency → `null`; division by zero → `null`; cycles are rejected at validation time, never evaluated.
- Deterministic across JS engines; no floating-point formatting concerns.

### D4 — Build output is CommonJS + declarations

Both packages emit CJS via `tsc` with `main`, `types`, and `exports`, and are consumed through workspace dependencies.

- Nest (CJS) consumes directly.
- Vite consumes CJS fine; tree-shaking of named exports still works.
- Metro consumes CJS reliably.
- Rejected alternative: publish TS source and rely on consumers to transpile (`transpilePackages` in Expo, Vite alias, Nest tsconfig paths). It works but creates three different resolution stories and breaks `tsc -b`/CI typechecking consistency.

Subpath exports (e.g. `@master-sheet/sheet-engine/formula`, `/validation`) keep mobile bundles lean.

### D5 — Validation parity is one function, not three similar ones

`@master-sheet/sheet-engine` exposes `validateTemplateStructure(input)` and `validateSheetData(structure, data)` returning a normalized `ValidationResult` (`{ ok: true, data } | { ok: false, issues: Issue[] }`). The API maps issues to HTTP 400; web maps them to RHF field errors; mobile maps them to inline field messages. No app re-implements the rules.

### D6 — Characterization before deletion

Before any app file is deleted, capture the current behavior of all three formula copies into a fixture corpus: expressions, inputs, expected outputs, and error cases (missing deps, divide-by-zero, unknown function, cycle). The extraction is accepted only when the new engine matches the corpus. Where the three copies disagree, the API copy wins (server is the source of truth) and the divergence is documented in the change.

### D7 — Enforce the dependency direction

Allowed: `apps/* → sheet-engine → contracts`, `apps/* → contracts`. Forbidden: `apps/* → other app`, `contracts → sheet-engine`, any package importing app code. Enforce with a small CI script that scans import specifiers (no new tooling) plus ESLint `no-restricted-imports` in the shared config.

## Risks / Trade-offs

- **[Formula behavior drifts during extraction]** → Characterization corpus (D6) is a gate; no app file is removed until it passes on Node and in a jsdom-free test run.
- **[A package accidentally imports Node/DOM/RN]** → CI boundary script bans `node:*`, `fs`, `path`, `window`, `document`, `react-native`, and `@nestjs/*` from `contracts`/`sheet-engine`; add an engine smoke test under the mobile Jest preset once available.
- **[CJS/ESM interop surprises]** → Single CJS output verified against Nest build, Vite build, and Metro bundle before deleting duplicates.
- **[Duplicate Zod instances cause `instanceof`/schema mismatch]** → Pin one Zod version in the workspace; do not add a second version in any app. Prefer `zod` v3-compatible API already used by web.
- **[Validation messages change and break UI or tests]** → Normalize `Issue` codes and keep user-facing copy in the apps; API keeps 400 semantics.
- **[Mobile bundle grows]** → Subpath exports + no Node polyfills; measure bundle before/after.
- **[Contract changes become breaking]** → Intentional: adding a required field should fail all consumers' typecheck, surfacing drift. Release all packages together (private, no semver ceremony).

## Migration Plan

1. Add the fixture corpus from the three existing implementations.
2. Scaffold `packages/contracts` and `packages/sheet-engine` with tests; match the formula corpus and port the duplicated `defaults.ts` helpers into `contracts` with characterization tests.
3. Migrate `apps/api`: template/sheet validation + formula evaluation delegate to the packages; keep `class-validator` for simple DTOs; delete `formula.util.ts`.
4. Migrate `apps/web`: replace `lib/formula.ts`, `features/templates/types/template-structure.ts`, `features/sheets/lib/defaults.ts`, and local sheet types with package imports.
5. Migrate `apps/mobile`: replace `lib/formula.ts`, `lib/defaults.ts`, and `types/template.ts` with package imports.
6. Add boundary checks to CI, update `docs/api/contracts.md` and the two capability specs.
7. Rollback: packages are additive until step 4/5 deletion commits; revert per app. No database migration involved.
