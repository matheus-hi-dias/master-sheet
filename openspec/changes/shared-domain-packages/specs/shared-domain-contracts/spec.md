## ADDED Requirements

### Requirement: Single Source of Truth for Domain Schemas

Template structure definitions, sheet data payloads, tag shapes, shared enums (systems and field types), and API request/response envelopes SHALL be defined exactly once in a shared workspace package. Applications SHALL NOT declare parallel interfaces, types, or validators for the same domain shapes.

#### Scenario: Duplicate type definition is rejected
- **WHEN** an application declares a local interface for a template field, sheet payload, or tag shape that already exists in the shared contracts package
- **THEN** the duplication is treated as a defect and removed in favor of the shared type

#### Scenario: One change propagates everywhere
- **WHEN** a new field type is added to the shared template schema
- **THEN** the API, web, and mobile typechecks fail until each consumer handles the new variant, with no parallel schema edits required

### Requirement: Runtime Validation Parity

The same schema definitions SHALL validate data on the server and on both frontends. Clients SHALL NOT implement alternative structural validation rules for template or sheet payloads.

#### Scenario: Server and client agree on a valid payload
- **WHEN** a payload passes shared validation in the web or mobile client and is submitted
- **THEN** the API accepts it without a structural validation error

#### Scenario: Server and client agree on an invalid payload
- **WHEN** a payload fails shared validation in a client
- **THEN** submitting the same payload directly to the API also fails with HTTP 400 and reports the same issue codes

### Requirement: Normalized Validation Issues

Shared validation SHALL return a structured result containing stable machine-readable issue codes and a path to the offending field, so each client can render its own user-facing message.

#### Scenario: Issue identifies the field and rule
- **WHEN** a sheet value violates a constraint (for example a number outside its declared range)
- **THEN** the validation result includes the field path, a stable code, and enough context for the client to display a localized message

### Requirement: Canonical Field Defaults and Coercion

Default values for each field type, structure-level default value construction, and value coercion helpers SHALL be defined once in the shared contracts package and consumed by every frontend. Applications SHALL NOT maintain local copies of default-construction or coercion logic.

#### Scenario: New sheet starts from the same defaults on both clients
- **WHEN** a sheet is created from a template in the web app and in the mobile app
- **THEN** both produce identical initial values for every field type, including `number`, `dots`, `checkbox`, `select`, `formula`, and `repeater`

#### Scenario: Existing values are preserved when seeding defaults
- **WHEN** default values are built with a seed containing an existing sheet value for a field
- **THEN** the seed value is used instead of the field default

#### Scenario: Coercion is identical across clients
- **WHEN** a raw JSON value (for example `null`, a numeric string, or a boolean) is coerced for rendering or formula input
- **THEN** web and mobile produce the same coerced value using the shared helper

### Requirement: Platform-Neutral Consumability

Shared packages SHALL NOT import DOM APIs, Node-specific modules, React Native modules, or server framework packages. They SHALL be consumable by the NestJS API, the Vite web app, and the Expo/Metro mobile app.

#### Scenario: Forbidden platform import fails CI
- **WHEN** a shared package imports `node:*`, `fs`, `path`, `window`, `document`, `react-native`, or `@nestjs/*`
- **THEN** the workspace boundary check fails the pipeline before merge

#### Scenario: Same package builds in all three consumers
- **WHEN** the API, web, and mobile apps build after consuming the shared package
- **THEN** all three resolve the package through declared workspace dependencies without aliases or consumer-specific transpilation requirements

### Requirement: Enforced Dependency Direction

Applications SHALL depend on shared packages, shared packages SHALL depend only on other shared packages, and no application SHALL import from another application. The shared contracts package SHALL NOT depend on the formula engine package.

#### Scenario: Cross-app import is rejected
- **WHEN** code in `apps/web` imports a module from `apps/mobile` or `apps/api`
- **THEN** the boundary check fails and the shared package is used instead

#### Scenario: Contracts remain leaf-level
- **WHEN** `@master-sheet/contracts` is inspected
- **THEN** it has no dependency on `@master-sheet/sheet-engine` or on any application workspace

### Requirement: Typed API Envelopes

Request and response envelopes for template, sheet, tag, and auth endpoints SHALL be typed from the shared contracts package so clients consume the same wire contract the API produces.

#### Scenario: Response shape change breaks clients at compile time
- **WHEN** an API response envelope field is renamed or removed in the shared contract
- **THEN** web and mobile typechecks fail at the affected call sites instead of failing at runtime
