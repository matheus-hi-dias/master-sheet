## MODIFIED Requirements

### Requirement: Safe Mathematical Formula Evaluation

The system SHALL support formula fields that derive values dynamically from other numeric fields using sandboxed arithmetic and standard math functions (`floor`, `ceil`, `round`, `abs`, `min`, `max`), preventing arbitrary code execution. Formula parsing, dependency resolution, cycle detection, and evaluation SHALL be provided by a single shared workspace package consumed by the API and both frontends; no application SHALL maintain an independent formula implementation.

#### Scenario: Formula Recalculation on Dependency Change
- **WHEN** a referenced dependency field value changes in the dynamic form
- **THEN** the formula field automatically recalculates its derived value according to its expression

#### Scenario: Circular Dependency Detection
- **WHEN** a template structure defines circular formula dependencies (e.g., A depends on B and B depends on A)
- **THEN** template validation fails with HTTP 400 Bad Request indicating a circular dependency loop

#### Scenario: Identical Result Across Server and Clients
- **WHEN** the same template structure, formula expression, and field values are evaluated on the API, the web app, and the mobile app
- **THEN** all three produce the same numeric result or the same null result for missing dependencies

#### Scenario: No Independent Evaluation Implementation
- **WHEN** the workspace is inspected for formula evaluation code
- **THEN** exactly one implementation exists in the shared engine package and applications only call it
