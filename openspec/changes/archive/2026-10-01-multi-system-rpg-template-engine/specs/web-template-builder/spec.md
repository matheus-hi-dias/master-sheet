## ADDED Requirements

### Requirement: Tabbed Templates Discovery Hub
The web application SHALL provide a tabbed Templates Hub allowing users to toggle between "Community Gallery" (public & official templates) and "My Templates" (user-created private & published templates) with debounced search, system filters, and dynamic tag filtering.

#### Scenario: Switching Between Gallery and My Templates
- **WHEN** the user clicks the "My Templates" tab on the Templates Hub
- **THEN** the hub fetches and displays templates authored by the logged-in user with edit, duplicate, and delete actions

#### Scenario: Opening Template Detail Drawer
- **WHEN** the user clicks "View Details" on a template card
- **THEN** the application opens a drawer displaying template system info, author, tabs preview, fields summary, and quick action buttons

### Requirement: Two-Pane Visual Template Builder
The web application SHALL provide a visual template builder with a two-pane layout: a left-hand structure canvas to configure tabs, sections, and field definitions, and a right-hand live preview rendering the dynamic form in real-time.

#### Scenario: Real-Time Field Preview Update
- **WHEN** the user adds a new section or field in the left canvas
- **THEN** the right preview pane immediately renders the new element and enables interactive testing

#### Scenario: Raw JSON Import and Export
- **WHEN** the user imports a valid template DSL JSON via the builder import modal
- **THEN** the visual builder parses the JSON and populates all tabs, sections, and fields in the canvas and live preview

### Requirement: Clarified Formula Authoring
The web builder's field inspector SHALL make formula references legible: dependency chips SHALL display the field label together with its id, the expression SHALL be accompanied by an id→label readout, dependency candidates SHALL be limited to numeric field types, the field id SHALL be editable (with a generate-from-label action), and the inline preview SHALL evaluate the expression against the structure's seeded default values rather than an empty context.

#### Scenario: Proofreading a Formula Expression
- **WHEN** the user inserts one or more dependency chips into a formula expression
- **THEN** the inspector renders a readout translating each id back to its field label so the expression is human-readable

#### Scenario: Previewing a Formula With Seeded Values
- **WHEN** the user is editing a valid formula expression
- **THEN** the inspector shows the computed numeric result using the dependency values seeded from the structure defaults

#### Scenario: Readable Dependency Chips
- **WHEN** the user opens the dependency candidate list for a formula field
- **THEN** only numeric-capable fields (`number`, `dots`, `checkbox`) are offered and each chip shows its label alongside its id
