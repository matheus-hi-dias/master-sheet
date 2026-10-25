## ADDED Requirements

### Requirement: Selective Shared Primitive Set

`@master-sheet/ui` SHALL contain only primitives that are duplicated across both frontends and have the same design contract: initially `GemLogo`, `Button`, `Tag`, and `DotTracker`. `Input` SHALL be added only after password-reveal and tooltip parity is explicitly defined.

#### Scenario: Shared set is intentional
- **WHEN** a component is proposed for the shared UI package
- **THEN** it has both a web and a native implementation need, an identical prop contract, and no app-specific dependency

#### Scenario: Input is not shared prematurely
- **WHEN** `Input` still has web-only behavior (password reveal, tooltip)
- **THEN** it remains app-local and is not published from the shared package

### Requirement: One Import Specifier with Platform Resolution

Each shared primitive SHALL be imported through a single specifier (for example `@master-sheet/ui/button`). Package export conditions SHALL resolve that specifier to the web implementation for Vite and the native implementation for Metro, with one shared TypeScript prop contract.

#### Scenario: Web resolves the DOM implementation
- **WHEN** the Vite web build imports `@master-sheet/ui/button`
- **THEN** the bundle contains the DOM implementation and no React Native or `react-native-svg` code

#### Scenario: Mobile resolves the native implementation
- **WHEN** the Metro/Expo build imports `@master-sheet/ui/button`
- **THEN** the bundle contains the React Native implementation

#### Scenario: Types are platform-independent
- **WHEN** TypeScript typechecks either app
- **THEN** both see the same exported props type for the primitive

### Requirement: Controlled Primitive Contract

Shared primitives SHALL accept controlled props (`value`/`onChange`, or `onPress` for actions) and SHALL NOT depend on React Hook Form, React Query, Zustand, or any application package.

#### Scenario: Web form binding uses an adapter
- **WHEN** a web form binds a shared primitive inside React Hook Form
- **THEN** the binding is done with `Controller` in the app and the primitive itself has no form-library import

#### Scenario: Mobile uses the primitive directly
- **WHEN** the mobile app passes `value` and `onChange` to a shared primitive
- **THEN** the primitive renders and reports changes without additional adapters

### Requirement: Behavioral Parity

Shared primitives SHALL behave identically on both platforms for the behavior they expose. Pure interaction logic (for example the dot toggle rule) SHALL be implemented once and used by both renderers.

#### Scenario: Dot toggle matches
- **WHEN** the same sequence of dot presses is applied on web and mobile
- **THEN** both produce the same numeric value, including the toggle-off behavior when the pressed dot equals the current value

#### Scenario: Variant and size matrix matches
- **WHEN** a `Button` is rendered with each variant/size combination on both platforms
- **THEN** both apply the same token-backed colors, borders, and typography decisions

### Requirement: Accessibility Parity

Each platform implementation SHALL expose equivalent accessible naming and roles for the same primitive usage.

#### Scenario: Dot control is announced
- **WHEN** a screen reader focuses a dot control on web or mobile
- **THEN** it announces the dot position and the total number of dots

#### Scenario: Icon-only button is labeled
- **WHEN** a shared button renders without visible text
- **THEN** the caller-supplied accessible label is exposed on both platforms

### Requirement: No Duplicate Implementation Remains

After a primitive is migrated, the corresponding local implementations in `apps/web` and `apps/mobile` SHALL be deleted. A primitive SHALL NOT be considered shared while a copy still exists.

#### Scenario: Migration is atomic
- **WHEN** `DotTracker` is migrated to the shared package
- **THEN** both local `DotTracker` files are removed in the same change

#### Scenario: Duplicate detection
- **WHEN** the workspace is inspected for a shared primitive name
- **THEN** exactly one implementation exists in the shared package plus its two platform renderers

### Requirement: Feature Components Remain App-Local

Feature components, screen layouts, form mappers, and toast systems SHALL remain in their application and SHALL NOT be added to the shared UI package without a new proposal.

#### Scenario: Scope boundary is enforced
- **WHEN** a `DynamicFormMapper`, `RepeaterField`, `RepeaterList`, `NumberStepper`, `Sidebar`, `BottomNav`, or toast component is proposed for the shared package
- **THEN** it is rejected unless a new capability proposal redefines the boundary

### Requirement: Peer Host Dependencies

React, React Native, and `react-native-svg` SHALL be peer dependencies of the shared UI package so each app supplies its own reconciler and no duplicate React copy is bundled.

#### Scenario: Single React instance
- **WHEN** the workspace dependency graph is inspected
- **THEN** `packages/ui` does not vendor its own `react` and each app resolves one React instance

#### Scenario: Version mismatch is visible
- **WHEN** an app's React or React Native version is incompatible with the package's peer range
- **THEN** installation or typechecking reports the mismatch rather than failing at runtime
