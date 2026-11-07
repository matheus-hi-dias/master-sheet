# sheet-engine Specification

## Purpose

Defines the dynamic template/sheet JSON duality, partial `Sheet.data` merge semantics, read-time calculated fields, structural validation parity between backend and clients, and the editing behavior expected of sheet editors (autosave, optimistic updates, rollback).
## Requirements
### Requirement: Dynamic JSON Duality (Template vs Sheet)

A `Template.structure` (JSONB) defines the layout, sectioning, field types, and formulas of a character sheet. A `Sheet.data` (JSONB) stores the values a player actually enters. The system MUST derive dynamic UIs and validation from `structure` and persist only `data`.

#### Scenario: Structure drives the UI and data stores only values

- **WHEN** a sheet is opened for a template
- **THEN** the rendered fields and constraints derive from `Template.structure`, while only the player-entered values are read from and written to `Sheet.data`

### Requirement: Partial Data Updates with JSONB Merge

`Sheet.data` updates MUST support partial `PATCH` semantics, merging only the submitted keys into the existing JSON via PostgreSQL JSONB merge semantics — never performing a full replacement.

#### Scenario: Editing a single attribute

- **WHEN** a client PATCHes `{ "data": { "hp": 42 } }`
- **THEN** only the `hp` key is updated and all other keys inside `data` are preserved.

### Requirement: Calculated Fields (Read-Time Computation)

Formula-based attributes defined by the template MUST be computed by the backend and included in the response DTO without being persisted as static values.

#### Scenario: Formula value is returned but not stored

- **WHEN** a sheet is retrieved and its template declares a formula field
- **THEN** the response DTO includes the computed value, and no static value for that formula field is persisted in `Sheet.data`

### Requirement: Structural Validation Parity

The backend MUST validate that a `Sheet.data` payload is structurally compatible with its `Template.structure` before persisting. Frontends MUST run equivalent parity validation client-side before submission rather than trusting the backend alone. The parity rules SHALL be implemented once in the shared domain packages and consumed by the backend and both frontends; independently authored client-side checks are not permitted.

#### Scenario: Server rejects an incompatible payload

- **WHEN** a client submits `Sheet.data` containing a value that conflicts with the template's declared field type or constraints
- **THEN** the API rejects the request with HTTP 400 and returns a structured validation issue identifying the offending field path

#### Scenario: Client blocks submission with the same rule

- **WHEN** a user enters data that conflicts with the template structure in the web or mobile editor
- **THEN** the client prevents submission using the shared validation result and surfaces the issue on the same field path

#### Scenario: Shared validation is the only implementation

- **WHEN** the workspace is inspected for template or sheet structural validation logic
- **THEN** the rules exist only in the shared domain packages and applications compose them without re-declaring constraints

### Requirement: Autosave & Debounce

Sheet editors MUST autosave with debouncing, dispatching React Query mutations without blocking user interaction, and handling conflicts gracefully.

#### Scenario: Rapid edits collapse into one debounced save

- **WHEN** a user makes several quick edits in a sheet editor
- **THEN** the editor dispatches a single debounced mutation once the edits settle, without blocking further input

### Requirement: Optimistic UI & Rollback (Web & Mobile)

Edits MUST apply optimistically in the UI before the API responds. When the request fails, the client MUST roll back to the last server-confirmed state.

#### Scenario: Optimistic update followed by network error

- **WHEN** a user edits a field and the subsequent request fails
- **THEN** the UI reverts to the previously confirmed server data and surfaces an error notification.

