# template-management Specification

## Purpose
TBD - created by archiving change multi-system-rpg-template-engine. Update Purpose after archive.
## Requirements
### Requirement: Template Forking
The system SHALL allow authenticated users to fork any accessible public template or owned template into their personal collection as a new private template, preserving lineage with `forkedFromId`.

#### Scenario: Successful Template Fork
- **WHEN** an authenticated user sends `POST /templates/:id/fork` for a public template
- **THEN** the system creates a new private template clone owned by the user, setting `forkedFromId` to the source template ID and returning HTTP 201

#### Scenario: Fork Inaccessible Private Template
- **WHEN** a user attempts to fork a private template owned by another user
- **THEN** the system rejects the request with HTTP 403 Forbidden

### Requirement: Template Deletion Protection
The system SHALL prevent deletion of templates that are currently in use by one or more active character sheets.

#### Scenario: Delete Template with Active Sheets
- **WHEN** an author attempts to delete a template that has one or more associated `Sheet` records
- **THEN** the system rejects the deletion with HTTP 409 Conflict explaining that active sheets depend on this template

#### Scenario: Delete Template without Sheets
- **WHEN** an author deletes a template that has zero associated sheets
- **THEN** the system deletes the template and returns HTTP 204 No Content

### Requirement: Server-Side Querying, Filtering, and Pagination
The system SHALL support server-side pagination, text search against name and description, filtering by system identifier, filtering by tags, and filtering by ownership scope on `GET /templates`.

#### Scenario: Paginated Search Query
- **WHEN** a client sends `GET /templates?page=1&limit=10&search=vampire&system=vampire_v5&scope=public`
- **THEN** the system returns a paginated response with matching templates and metadata `{ total, page, limit, totalPages }`

