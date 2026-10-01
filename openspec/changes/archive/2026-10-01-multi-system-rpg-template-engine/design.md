## Context

Master-Sheet is a Turborepo monorepo consisting of:
- `apps/api`: NestJS, Prisma ORM, PostgreSQL.
- `apps/web`: React + Vite SPA, Tailwind CSS, React Query.
- `apps/mobile`: React Native / Expo, NativeWind, React Query.

Currently, templates only accept arbitrary JSON without schema validation, lack server-side search and pagination, and have no visual builder or dynamic form mapping. Mobile and Web currently mock or hardcode sheet attributes.

## Goals / Non-Goals

**Goals:**
- Define a standardized, extensible JSON DSL for RPG sheet structures (`Template.structure`), including support for tabs, grid sections, diverse field types (`number`, `text`, `dots`, `select`, `checkbox`, `formula`, `repeater`).
- Implement recursive NestJS DTO validation for template creation and updates.
- Support template forking with author lineage and prevent deleting templates in use by active character sheets.
- Add optimized single-query guard authorization and server-side search/filter/pagination on `GET /templates`.
- Implement a 2-Pane Template Visual Builder on Web with real-time interactive preview and raw JSON import/export.
- Implement a Dynamic Form Mapper with a safe math formula evaluator across Web and Mobile.
- Replace static D&D rendering in Mobile sheets with dynamic rendering of template structure tabs, dot trackers, steppers, and a contextual FAB dice roller.
- Implement a creator-lite Mobile Template Builder: drill-down structure editing (tabs → sections → fields), bottom-sheet field configuration, live preview reusing the mobile sheet renderer, and a "Meus modelos" gallery scope (`scope=mine`) as its entry point.

**Non-Goals:**
- Real-time multiplayer synchronization or collaborative sheet editing (WebSockets/CRDTs) — to be scoped separately.
- Automated third-party PDF to template OCR parsing.
- Marketplace payment processing for premium templates.
- Full desktop-builder parity on Mobile: drag-and-drop reorder, raw JSON import/export, and multi-tab interactive preview on Mobile are deferred.
- In-app community publish/approval (moderation) flows for crowd-sourced templates.

## Decisions

### 1. Standardized JSON DSL Schema for `Template.structure`
- **Structure Tree:**
  - `system`: String identifier (e.g., `dnd5e`, `vampire_v5`, `tormenta20`, `coc7e`, `custom`).
  - `version`: Integer for structure versioning.
  - `tabs`: Array of `TabDefinition` (`id`, `label`, `icon`, `sections: SectionDefinition[]`).
  - `sections`: Array of `SectionDefinition` (`id`, `title`, `columns: 1..4`, `fields: FieldDefinition[]`).
  - `fields`: Array of `FieldDefinition` with discriminator `type`:
    - `number`: `min`, `max`, `step`, `defaultValue`
    - `text` / `textarea`: `placeholder`, `maxLength`
    - `dots`: `maxDots` (e.g. 5, 10 for Vampire hunger/blood/disciplines), `defaultValue`
    - `select`: `options: Array<{ label: string, value: string }>`
    - `checkbox`: `defaultValue: boolean`
    - `formula`: `expression: string`, `dependencies: string[]` (e.g. `floor((str - 10) / 2)`)
    - `repeater`: `itemSchema: FieldDefinition[]` (for inventories, spells, weapons)
- **Rationale:** Supports any tabletop RPG ruleset without hardcoded database tables per system.

### 2. Math Formula Evaluator (Safe, Sandboxed)
- **Choice:** Lightweight mathematical expression evaluator based on tokenization / AST or safe regex evaluator supporting standard math functions (`floor`, `ceil`, `round`, `abs`, `min`, `max`, basic arithmetic).
- **Alternative considered:** `eval()` or `new Function()` — rejected due to XSS and remote code injection risks.

### 3. Template Forking & Deletion Integrity
- **Forking:** `POST /templates/:id/fork` clones the template data, assigns `authorId = currentUser.userId`, sets `isPublic = false`, sets `forkedFromId = original.id`, and appends `(Cópia)` to the name.
- **Delete Protection:** `DELETE /templates/:id` checks `_count.sheets`. If sheets > 0, returns `409 Conflict` (or soft-deletes/archives) to prevent breaking existing character sheets.

### 4. Single-Query Access Guard Optimization
- In `TemplateAccessGuard`, attach the fetched template record to `request.template`. In `TemplatesController` / `TemplatesService`, use the pre-fetched record or request context when retrieving single templates.

### 5. Web Template Builder (2-Pane UI)
- Left pane: Visual hierarchy tree where users add/reorder tabs, configure grid sections, and customize fields with dedicated type inspectors.
- Right pane: Live preview rendering the Dynamic Form Mapper with reactive formula updates in real time.
- Modal: Raw JSON Import/Export with validation.

### 6. Mobile Native Dynamic Form Mapper
- Render `template.structure.tabs` using segmented/swipeable tabs.
- Custom mobile inputs:
  - `NumberStepper`: Increment/decrement buttons + direct text input.
  - `DotTracker`: Touchable circles for Vampire/Storyteller traits.
  - `RepeaterList`: Expandable list for inventory items and spells.
  - `ContextualDiceRoller`: FAB opens a sheet with all numeric attributes from the character sheet to roll against.

### 7. Mobile Template Builder (Creator-Lite & At-the-Table)
- **Scope:** Serves two adjacent jobs — an authoring job, condensed to phone-appropriate shape, and an at-the-table job (quick label/default/`maxDots` or field tweaks on templates the user already owns). Not a full desktop parity clone.
- **Entry Point:** Reuse the templates tab with a segmented control "Explorar" vs "Meus modelos" (`scope=mine` via the existing `fetchTemplates` `scope` param). The builder is a stack route (not a fourth tab), reachable via "Criar modelo" and from a user's own template. Blank creation is possible but not the default posture — editing existing drafts/forks is the primary flow.
- **Navigation Model:** Drill-down navigator — Tab list → Section list → Field list. At every level: inline rename, chevron ▼/▲ reorder (mirrors the Web builder, no drag gestures), and delete. Tapping a field opens the bottom-sheet inspector.
- **Field Inspector:** Pocket-port of the Web `FieldConfigForm` as a bottom sheet covering all DSL types. Formula fields keep `expression` + auto-derived dependency chips (via `extractIdentifiers`) plus inline evaluated-result feedback using the mobile formula evaluator; repeater fields expose an `itemSchema` editor.
- **Live Preview:** A modal reusing the existing `DynamicSheetRenderer` seeded with structure defaults; the preview is remounted (shapeKey-style) on structure change so edits are immediately visible.
- **Persistence & Validation:** Reuses `POST /templates` / `PATCH /templates/:id`; surfaces `400` validation failures as toasts. Cheap client-side checks (duplicate ids, non-empty `itemSchema`, resolvable formula deps) are inline; full depth-1 validation remains server-side.
- **Rationale:** The Web builder is already phone-shaped (chevron reorder, chips, inspector form), the DSL types are ported to Mobile (`apps/mobile/types/template.ts`), and Mobile already ships a structure renderer — making the least-obvious win (live preview) the cheapest component of the Mobile builder.

### 8. Formula Authoring Clarity (Web & Mobile)
- **Problem:** Formula expressions reference random, opaque field ids (`f_x7k9qm`), while the builder's dependency chips display labels — so the expression is unreadable, the inline preview evaluates against an empty context (always "unknown identifier"), and non-numeric fields are offered as dependencies.
- **Decision:** Keep ids as the canonical reference (preserves `Sheet.data` keys and avoids a DSL contract change), but (a) generate human-readable slug ids from field labels for new fields, deduplicated; (b) expose the id as editable with a generate-from-label action; (c) regenerate the id from the label only while it is still auto-derived, rewriting all formula `dependencies` and expression identifiers via a token-aware `rewireFieldId`/`replaceIdentifier`; (d) show `Label · id` chips plus an id→label readout; (e) evaluate the preview against a seeded numeric context built from structure defaults and list the values used; (f) restrict dependency candidates and the validator to numeric types (`number`, `dots`, `checkbox`).
- **Rationale:** Fixes the legibility and broken-preview problems without changing the DSL contract or breaking existing sheets/templates (existing random ids are treated as user-owned and never mutated). Mirrored on Web and Mobile to keep the authoring experience consistent.

## Risks / Trade-offs

- **[Risk] Complex formula circular dependencies (e.g. A depends on B, B depends on A)**
  → **Mitigation:** Implement cycle detection during template validation and limit formula recursion depth to 1.
- **[Risk] High volume of fields causing re-render lag in Web and Mobile**
  → **Mitigation:** React Hook Form uncontrolled inputs with targeted subscriptions, only recalculating formula nodes when their explicit dependencies change.
- **[Risk] Breaking existing sheets when template author updates structure**
  → **Mitigation:** Template updates preserve field keys. Non-destructive changes only; structural changes bump the template version.

## Migration Plan

1. Run Prisma database migration: `pnpm --filter api exec prisma migrate dev --name add_template_system_version_forks`.
2. Seed/backfill default system templates (D&D 5e, Vampire V5, Tormenta 20) with valid DSL structures.
3. Deploy Backend API changes and verify DTO validation.
4. Deploy Frontend Web Template Hub, Dynamic Form Engine, and Builder.
5. Deploy Mobile updates with dynamic sheet screen, "Meus modelos" scope, and the creator-lite builder.
