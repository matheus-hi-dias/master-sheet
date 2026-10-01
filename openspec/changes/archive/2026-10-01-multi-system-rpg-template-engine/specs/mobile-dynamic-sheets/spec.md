## ADDED Requirements

### Requirement: Dynamic Mobile Sheet Form Rendering
The mobile application SHALL render character sheets dynamically according to the template's structured tabs and field definitions, replacing static hardcoded D&D attributes.

#### Scenario: Rendering Non-D&D Template Tabs
- **WHEN** a user opens a character sheet based on a Vampire V5 or custom template
- **THEN** the mobile app renders the specific tabs defined in the template (e.g., Disciplines, Blood Tracks) with touchable dot trackers and steppers

#### Scenario: Dynamic Field Value Modification
- **WHEN** a user interacts with a stepper or dot counter on the mobile sheet
- **THEN** the local state updates optimistically and triggers auto-save mutation to the backend

### Requirement: Contextual Attribute Dice Roller
The mobile application SHALL provide a floating action button (FAB) dice roller that dynamically extracts numeric attributes from the active sheet structure, allowing quick roll selections with appropriate modifiers.

#### Scenario: Quick Roll Selection
- **WHEN** the user taps the FAB dice roller
- **THEN** a contextual modal presents the list of attributes from the active sheet for the user to roll against
