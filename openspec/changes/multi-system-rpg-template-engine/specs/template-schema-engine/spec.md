## ADDED Requirements

### Requirement: Standardized Template DSL Schema
The system SHALL enforce a structured JSON DSL for all template structures, consisting of top-level system metadata, version, and an array of tabs containing sections with configurable grid columns and typed field definitions.

#### Scenario: Valid Template Structure Submission
- **WHEN** a user creates or updates a template with valid tabs, sections, and supported field types (`number`, `text`, `textarea`, `dots`, `select`, `checkbox`, `formula`, `repeater`)
- **THEN** the API accepts the payload with HTTP 200/201 and persists the structured JSON

#### Scenario: Invalid Field Type Submission
- **WHEN** a user submits a template structure containing an unknown field type (e.g. `unsupported_type`)
- **THEN** the API rejects the request with HTTP 400 Bad Request detailing the schema validation error

### Requirement: Safe Mathematical Formula Evaluation
The system SHALL support formula fields that derive values dynamically from other numeric fields using sandboxed arithmetic and standard math functions (`floor`, `ceil`, `round`, `abs`, `min`, `max`), preventing arbitrary code execution.

#### Scenario: Formula Recalculation on Dependency Change
- **WHEN** a referenced dependency field value changes in the dynamic form
- **THEN** the formula field automatically recalculates its derived value according to its expression

#### Scenario: Circular Dependency Detection
- **WHEN** a template structure defines circular formula dependencies (e.g., A depends on B and B depends on A)
- **THEN** template validation fails with HTTP 400 Bad Request indicating a circular dependency loop
