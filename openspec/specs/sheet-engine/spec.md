# sheet-engine Specification

## Requirements

### Requirement: Dynamic JSON Duality (Template vs Sheet)
A `Template.structure` (JSONB) defines the layout, sectioning, field types, and formulas of a character sheet. A `Sheet.data` (JSONB) stores the values a player actually enters. The system MUST derive dynamic UIs and validation from `structure` and persist only `data`.

### Requirement: Partial Data Updates with JSONB Merge
`Sheet.data` updates MUST support partial `PATCH` semantics, merging only the submitted keys into the existing JSON via PostgreSQL JSONB merge semantics — never performing a full replacement.

#### Scenario: Editing a single attribute
- **WHEN** a client PATCHes `{ "data": { "hp": 42 } }`
- **THEN** only the `hp` key is updated and all other keys inside `data` are preserved.

### Requirement: Calculated Fields (Read-Time Computation)
Formula-based attributes defined by the template MUST be computed by the backend and included in the response DTO without being persisted as static values.

### Requirement: Structural Validation Parity
The backend MUST validate that a `Sheet.data` payload is structurally compatible with its `Template.structure` before persisting. Frontends MUST run equivalent parity validation client-side before submission rather than trusting the backend alone.

### Requirement: Autosave & Debounce
Sheet editors MUST autosave with debouncing, dispatching React Query mutations without blocking user interaction, and handling conflicts gracefully.

### Requirement: Optimistic UI & Rollback (Web & Mobile)
Edits MUST apply optimistically in the UI before the API responds. When the request fails, the client MUST roll back to the last server-confirmed state.

#### Scenario: Optimistic update followed by network error
- **WHEN** a user edits a field and the subsequent request fails
- **THEN** the UI reverts to the previously confirmed server data and surfaces an error notification.