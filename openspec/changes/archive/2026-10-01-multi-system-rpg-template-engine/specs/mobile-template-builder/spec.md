## ADDED Requirements

### Requirement: Mobile Template Gallery Scope Toggle
The mobile application SHALL allow browsing both the public gallery ("Explorar") and the logged-in user's own templates ("Meus modelos") via a segmented control above the template list, requesting `scope=mine` from the templates API when browsing personal templates.

#### Scenario: Switching Between Public Gallery and My Templates
- **WHEN** the user taps "Meus modelos" in the mobile templates tab
- **THEN** the app fetches and displays templates authored by the logged-in user (`scope=mine`) and pagination restarts from page 1

#### Scenario: Returning to the Public Gallery
- **WHEN** the user taps "Explorar" after browsing their own templates
- **THEN** the app refetches the public gallery with the same search and system filters still applied

### Requirement: Creator-Lite Mobile Template Builder
The mobile application SHALL provide a template builder accessible as a stack route (not an additional tab) that supports the full DSL editing loop in a phone-appropriate shape: create from blank or continue editing an existing user-owned template, with drill-down navigation (tabs → sections → fields), inline rename, chevron-based reorder, delete, and metadata editing (name, description, system, public/private, tags). Persistence SHALL reuse the existing template create/update API, surfacing validation failures (`400`) as user-facing toasts.

#### Scenario: Editing an Existing User Template
- **WHEN** the user opens one of their own templates in the builder
- **THEN** the drill-down navigator reflects the template's tabs, sections, and fields and the user can rename, reorder, and delete elements at every level before saving

#### Scenario: Creating a Template From Blank
- **WHEN** the user starts a new blank template from "Meus modelos"
- **THEN** the builder seeds a default tab/section and persists a new template on save via `POST /templates`

### Requirement: Mobile Field Configuration Inspector
The mobile application SHALL provide a bottom-sheet field inspector covering all DSL field types, including a formula editor with auto-derived dependency chips (from `extractIdentifiers`) and inline evaluated result feedback, and a repeater editor for nested `itemSchema` fields. The inspector SHALL make formula references legible: dependency chips display the field label together with its id, dependency candidates are limited to numeric field types (`number`, `dots`, `checkbox`), the field id is editable with a generate-from-label action, an id→label readout accompanies the expression, and the inline preview evaluates against the structure's seeded default values rather than an empty context.

#### Scenario: Configuring a Formula Field
- **WHEN** the user edits a formula field in the mobile builder
- **THEN** dependency chips are derived from the expression, only numeric fields are offered, and an inline evaluation preview of the expression is rendered using the structure's seeded default values

#### Scenario: Proofreading a Formula Expression On Mobile
- **WHEN** the user inserts a dependency chip into a formula expression
- **THEN** the inspector shows a readout translating the referenced ids back to their field labels

### Requirement: Mobile Builder Live Preview
The mobile application SHALL render a preview of the current draft structure by reusing the existing dynamic sheet renderer, seeded with structure defaults, and remount the preview when the structure changes.

#### Scenario: Previewing Structural Edits
- **WHEN** the user opens the preview from the builder
- **THEN** a modal renders tabs, sections, and fields as the sheet will appear, rebuilt to reflect the latest structural changes

### Requirement: Mobile Build-Time Structure Validation
The mobile builder SHALL run cheap client-side checks — duplicate field ids, non-empty `itemSchema`, and resolvable formula dependencies — surfacing them inline, while delegating full depth-1 validation to the backend.

#### Scenario: Duplicate Field Id
- **WHEN** a structure contains two fields with the same id
- **THEN** the builder surfaces an inline error before the template can be saved