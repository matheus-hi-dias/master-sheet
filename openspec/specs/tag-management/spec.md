# tag-management Specification

## Requirements

### Requirement: Dual-Scope Tag Isolation
Tags operate in two isolated scopes. Template tags are global discovery metadata (system/generic) and are read-only for users who do not own the template. Sheet tags are private user organization tags. Mutating a Sheet's tags MUST NOT affect the source Template or any other user's sheets.

#### Scenario: Tagging a personal sheet
- **WHEN** an authenticated user adds or removes a tag on their own Sheet
- **THEN** only the Sheet tag relation changes and the underlying Template's tag set remains untouched.

#### Scenario: Consuming a public template's tags
- **WHEN** a user browses or forks a public template
- **THEN** the user cannot alter the template's global tags; the tags only serve gallery filtering.

### Requirement: Tag Normalization
All tag names MUST be normalized with `.toLowerCase().trim()` before persistence to guarantee canonical, case-insensitive uniqueness.

### Requirement: Unique Tag Persistence (connectOrCreate)
Tag writes MUST use Prisma's `connectOrCreate` keyed on the unique normalized name so a tag is never duplicated. The correct N:N relation (Template or Sheet) is linked according to the dual-scope rule.

### Requirement: Guarded Tag Mutations
Endpoints that mutate tag relations MUST validate ownership (`OwnerGuard` / `TemplateAccessGuard`) before changing template or sheet tags. Sheet endpoints may only change `SheetTag`; template endpoints may only change `TemplateTag`.

### Requirement: Complex Filtering
Gallery discovery MUST support `AND`/`OR` tag filters via query parameters (e.g. `?tags=D&D,Fantasy`) for template filtering. A user's dashboard MUST allow filtering their sheets by private Sheet tags.