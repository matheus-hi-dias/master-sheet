## 1. Backend: Prisma Schema & Database Migration

- [ ] 1.1 Update `Template` model in `apps/api/prisma/schema.prisma` with `system`, `version`, `isOfficial`, `forkedFromId` self-relation, `createdAt`, `updatedAt`, and indexes
- [ ] 1.2 Run Prisma migration script (`pnpm --filter api exec prisma migrate dev --name add_template_system_version_forks`) and generate client

## 2. Backend: Template DSL, Types & DTO Validation

- [ ] 2.1 Define strongly typed TypeScript interfaces for `TemplateStructure`, `TabDefinition`, `SectionDefinition`, and `FieldDefinition` with all supported field types
- [ ] 2.2 Implement nested validation DTOs with `class-validator` / `class-transformer` for `TemplateStructureDto` in `CreateTemplateDto` and `UpdateTemplateDto`
- [ ] 2.3 Implement formula dependency validation and cycle detection utility

## 3. Backend: Template Services & Controller Enhancements

- [ ] 3.1 Optimize `TemplateAccessGuard` to attach pre-fetched template on `request.template` to eliminate redundant database queries
- [ ] 3.2 Implement `POST /templates/:id/fork` endpoint in `TemplatesService` and `TemplatesController` to clone templates with lineage
- [ ] 3.3 Add dependency check in `TemplatesService.remove` to prevent deleting templates with active `Sheet` instances
- [ ] 3.4 Upgrade `TemplatesService.findAll` with server-side pagination (`page`, `limit`), search query, system filter, tags filter, and scope (`public` vs `mine`)

## 4. Frontend Web: Templates Hub & Discovery

- [ ] 4.1 Update `TemplatesHub.tsx` with tabbed navigation ("Community Gallery" vs "My Templates") and dynamic tag filter cloud
- [ ] 4.2 Connect search and system dropdown to server-side paginated queries with debouncing
- [ ] 4.3 Create `TemplateDetailDrawer` component to inspect template tabs, fields summary, author, and quick actions ("Create Sheet", "Fork Template")
- [ ] 4.4 Implement fork action mutation on template cards and detail drawer

## 5. Frontend Web: Dynamic Form Engine & Formula Evaluator

- [ ] 5.1 Create safe mathematical formula evaluator utility supporting standard RPG arithmetic (`floor`, `ceil`, `round`, dependencies)
- [ ] 5.2 Build `DynamicFormMapper` component rendering tabs, grid sections, and specialized field inputs (`number`, `text`, `dots`, `select`, `checkbox`, `formula`, `repeater`)
- [ ] 5.3 Implement reactive formula recalculation binding with `react-hook-form`

## 6. Frontend Web: Visual Template Builder

- [ ] 6.1 Create `TemplateBuilder` page and route at `/templates/builder` with 2-pane layout (structure canvas + live preview)
- [ ] 6.2 Implement tab and grid section editor (add, delete, reorder, configure columns 1-4)
- [ ] 6.3 Implement field configuration inspector for all field types (including formula builder with auto-complete assist)
- [ ] 6.4 Implement raw JSON Import/Export modal with schema validation

## 7. Frontend Mobile: Gallery & Bottom Sheet Preview

- [ ] 7.1 Add search `TextInput` and horizontal system filter chips to `apps/mobile/app/(tabs)/templates.tsx`
- [ ] 7.2 Implement `TemplatePreviewBottomSheet` modal displaying summary of tabs and key attributes before creating a sheet
- [ ] 7.3 Connect mobile gallery to the updated server-side paginated API

## 8. Frontend Mobile: Dynamic Sheet View & Contextual Dice Roller

- [ ] 8.1 Replace hardcoded D&D stats in `apps/mobile/app/sheets/[id].tsx` with the dynamic form renderer interpreting `template.structure.tabs`
- [ ] 8.2 Build native tactile mobile inputs (`NumberStepper`, `DotTracker`, `RepeaterList`) with NativeWind styling
- [ ] 8.3 Overhaul the FAB dice roller to dynamically extract available numeric attributes from the active sheet structure for roll tests
