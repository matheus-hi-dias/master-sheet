## MODIFIED Requirements

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
