## Why

Master-Sheet is conceived as a multi-system RPG character sheet ecosystem, but currently lacks a standardized template structure specification, validation layer, visual template builder, and dynamic form rendering engine. Templates currently accept arbitrary unvalidated JSON, search/pagination is missing, actions are stubbed out on Web, and Mobile hardcodes static D&D attributes regardless of the chosen system. This change introduces a standardized dynamic template engine, template builder, forking mechanism, and multi-system dynamic sheet rendering across Backend, Web, and Mobile.

## What Changes

- **Backend (NestJS + Prisma):**
  - Update `Template` Prisma model with `system`, `version`, `isOfficial`, `forkedFromId` (fork lineage), `createdAt`, `updatedAt`, and optimized query indexes.
  - Define a typed, structured JSON DSL for `Template.structure` (tabs, grid sections, fields, formulas, and types including `number`, `text`, `dots`, `select`, `checkbox`, `formula`, `repeater`).
  - Add deep DTO validation for template creation and updates.
  - Implement `POST /templates/:id/fork` to clone templates with lineage tracking.
  - Add delete protection preventing deletion of templates with active sheet instances.
  - Optimize `TemplateAccessGuard` to eliminate redundant database queries.
  - Add server-side search, system/tag filtering, and pagination (`page`, `limit`) to `GET /templates`.
- **Frontend Web (React + Vite SPA):**
  - Upgrade `TemplatesHub` with tabbed navigation ("Community Gallery" vs "My Templates"), debounced server-side search, system filters, and template details drawer.
  - Build the Dynamic Form Engine interpreting `Template.structure` with reactive formula recalculation.
  - Create the Visual Template Builder (`/templates/builder`) with a 2-pane UI (layout canvas + interactive live preview) and raw JSON import/export.
- **Frontend Mobile (Expo + NativeWind):**
  - Upgrade mobile templates gallery with search, system filters, and preview bottom sheets.
  - Update sheet screen (`/sheets/[id]`) to dynamically render `template.structure.tabs`, supporting native steppers, touchable dot counters, and repeaters.
  - Implement a contextual dice roller floating action button (FAB) that populates attributes from the active sheet structure.

## Capabilities

### New Capabilities
- `template-schema-engine`: Standardized JSON DSL specification for RPG templates, type definitions, and mathematical formula evaluation.
- `template-management`: Full template lifecycle, forking lineage, dependency-aware deletion protection, server-side pagination, search, and filtering.
- `web-template-builder`: Visual drag/configure template builder with live preview and dynamic form mapping on Web.
- `mobile-dynamic-sheets`: Dynamic native sheet rendering based on template structure and contextual dice roller on Mobile.

### Modified Capabilities
<!-- None -->

## Impact

- **Database:** Prisma schema migration for `Template` model fields and indexes.
- **API Endpoints:**
  - `GET /templates` (enhanced with query parameters: `page`, `limit`, `search`, `system`, `tags`, `scope`).
  - `POST /templates/:id/fork` (new).
  - `DELETE /templates/:id` (dependency check with existing sheets).
  - `POST /templates` and `PATCH /templates/:id` (validated against the new DSL schema).
- **Web App:** New route `/templates/builder`, new template detail drawer component, dynamic form mapper component, updated `TemplatesHub.tsx`.
- **Mobile App:** Updated `app/(tabs)/templates.tsx`, overhauled `app/sheets/[id].tsx` from static D&D fields to dynamic tab/field rendering.
