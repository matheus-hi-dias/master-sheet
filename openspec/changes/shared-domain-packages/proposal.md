## Why

Template/sheet domain knowledge currently exists in three independent copies: `apps/web/src/lib/formula.ts` (311 lines), `apps/mobile/lib/formula.ts` (312 lines), and `apps/api/src/templates/utils/formula.util.ts`. The template structure types are duplicated between `apps/web/src/features/templates/types/template-structure.ts` and `apps/mobile/types/template.ts`, and the API's DTO shapes are re-declared by hand in both clients. `template-schema-engine` already requires "sandboxed formula evaluation shared by every client" and `sheet-engine` requires "structural validation parity" — but nothing in the workspace enforces that shared implementation. Every field-type or formula-rule change is a three-file edit with a silent runtime mismatch on the fourth.

## What Changes

- Introduce `packages/contracts`: the single source of truth for domain types and runtime schemas (Template structure DSL, Sheet data payloads, Tag shapes, API request/response envelopes, auth session types), authored with Zod and exported as types plus validators.
- Introduce `packages/sheet-engine`: a pure, platform-neutral TypeScript package owning formula parsing/evaluation, dependency graph and cycle detection, and structural template/sheet validation. No DOM, no Node, no React Native APIs.
- Move field default construction and value coercion into `packages/contracts`: `apps/web/src/features/sheets/lib/defaults.ts` and `apps/mobile/lib/defaults.ts` are function-for-function duplicates (`defaultFieldValue`, `buildDefaultValues`, `buildItemDefaults`, `structureDefaultValues`), plus mobile-only `toNumber`/`toStringValue`.
- Refactor `apps/api` to consume `packages/contracts` for DTO-compatible types and `packages/sheet-engine` for formula evaluation and structural validation, replacing `apps/api/src/templates/utils/formula.util.ts`.
- Refactor `apps/web` and `apps/mobile` to consume the same packages, deleting `lib/formula.ts`, `types/template.ts`, and `features/templates/types/template-structure.ts` duplicates.
- Establish a shared API client contract: one typed transport layer in `packages/contracts` (or a sibling `packages/api-client`) so auth/refresh behavior and endpoint types are defined once and consumed by web and mobile.
- **BREAKING** (internal): package extraction changes import paths and build ordering; `sheet-engine` and `contracts` become build dependencies of all three apps, and their outputs must be declared in `turbo.json`.

## Capabilities

### New Capabilities

- `shared-domain-contracts`: Defines the requirement that domain types and runtime schemas have exactly one workspace source of truth, are importable by API, web, and mobile without duplication, and are validated identically at build/run time.

### Modified Capabilities

- `template-schema-engine`: The "Safe Mathematical Formula Evaluation" requirement is strengthened from a behavioral contract to a single shared implementation; clients and server MUST consume the same package for expression evaluation, dependency resolution, and circular-dependency detection.
- `sheet-engine`: The "Structural Validation Parity" requirement is strengthened to mandate one shared schema implementation used by backend validation and both frontends, replacing independently authored client checks.

## Impact

- New packages: `packages/contracts`, `packages/sheet-engine` (and possibly `packages/api-client`).
- Modified apps: `apps/api` (templates/sheets services, DTOs, formula util removal), `apps/web` (features/templates types, lib/formula and features/sheets/lib/defaults removal, services/api typing), `apps/mobile` (types/template, lib/formula and lib/defaults removal, services/api typing).
- Build: `turbo.json` build/test graph, `tsconfig` project references or path mappings, package exports must be React-Native-safe (no DOM imports).
- Dependencies: Zod (already present in web) becomes a shared contract dependency; mobile may need it; API may adopt it for shared schema validation while retaining `class-validator` at the HTTP boundary.
- Docs/specs: `docs/api/contracts.md` and `openspec/specs/{sheet-engine,template-schema-engine}/spec.md` need alignment; `docs/design-system.md` unaffected.
- Risk: formula semantics must not change during extraction; parity tests are required before deleting the three existing implementations.
