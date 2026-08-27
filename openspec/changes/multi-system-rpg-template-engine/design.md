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

**Non-Goals:**
- Real-time multiplayer synchronization or collaborative sheet editing (WebSockets/CRDTs) — to be scoped separately.
- Automated third-party PDF to template OCR parsing.
- Marketplace payment processing for premium templates.

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
5. Deploy Mobile updates with dynamic sheet screen.
