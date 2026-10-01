# template-schema-engine Specification

## Purpose
TBD - created by archiving change multi-system-rpg-template-engine. Update Purpose after archive.
## Requirements
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

### Requirement: Readable, Stable Field Identifiers
Field `id`s SHALL remain the canonical reference used by formula expressions and `dependencies`, and SHALL be stable across template updates to preserve existing `Sheet.data` keys. Template builders SHALL generate human-readable, label-derived field ids (slugified) for new fields, deduplicated within the structure, while preserving externally supplied ids.

#### Scenario: Label-Derived Field Id Generation
- **WHEN** a builder creates a new field labeled "Força"
- **THEN** the generated field `id` is a readable slug of the label (e.g. `forca`), deduplicated with a numeric suffix if it already exists

#### Scenario: Formula References Stay In Sync On Rename
- **WHEN** a builder field's id changes while it is still auto-derived from its label
- **THEN** every formula `dependencies` entry and expression identifier that referenced the old id is rewritten to the new id, and any user-edited (non-auto) id is left untouched

#### Scenario: Non-Numeric Dependency Rejected
- **WHEN** a formula declares a dependency on a non-numeric field (e.g. `text` or `select`)
- **THEN** client-side builder validation flags the dependency as invalid

