## ADDED Requirements

### Requirement: Single Source of Visual Tokens

Colors, light-theme overrides, radii, spacing, typography, shadows, and motion tokens SHALL be defined exactly once in `@master-sheet/design-tokens`. Application styles SHALL consume generated artifacts and SHALL NOT declare duplicate literal token values.

#### Scenario: Token change propagates to both platforms
- **WHEN** the gold color value is changed in the shared token source
- **THEN** both the web theme and the mobile theme reflect the new value without editing app-level CSS or Tailwind config

#### Scenario: Duplicate literal tokens are rejected
- **WHEN** an application stylesheet or Tailwind config declares a color, radius, or font hex/value that already exists in the token source
- **THEN** the drift check reports it and the duplicate is removed in favor of the generated token

### Requirement: Themes Defined Once

The dark (default) and light themes SHALL both be expressed in the shared token source, including every value that currently differs between them.

#### Scenario: Light theme parity
- **WHEN** the light theme is activated on web and on mobile
- **THEN** both surfaces use the same background, panel, card, text, gold, and border values

### Requirement: Shared Font Assets and Manifest

Font files and the mapping of family names to weights/files SHALL live in the shared package. Web and mobile SHALL load fonts from that shared source.

#### Scenario: Web actually renders the display font
- **WHEN** the web app renders text using the display font token
- **THEN** the Cinzel family is loaded through the shared font assets and is used instead of a fallback serif

#### Scenario: Mobile renders the same families
- **WHEN** the mobile app loads fonts at startup
- **THEN** it uses the shared manifest and the same font files as web, with no locally duplicated family names

### Requirement: Deterministic Generated Artifacts

Token artifacts (CSS custom properties, Tailwind/NativeWind theme, typed constants) SHALL be generated deterministically and committed so both bundlers can consume them without a dev-time build step.

#### Scenario: Regeneration is idempotent
- **WHEN** the token build runs twice without source changes
- **THEN** the generated files are byte-identical

#### Scenario: Stale artifacts fail CI
- **WHEN** a token source changes without regenerating the committed artifacts
- **THEN** CI fails with a diff pointing at the stale generated files

### Requirement: Platform-Appropriate Consumption

Web SHALL consume tokens as CSS custom properties and Tailwind theme values. Mobile SHALL consume them through the NativeWind preset and typed constants for values that cannot use CSS variables.

#### Scenario: Native-only value uses a typed constant
- **WHEN** a native component needs a token value outside styling (for example an SVG stroke or placeholder color)
- **THEN** it imports the typed constant from the shared package instead of hard-coding the value

### Requirement: Centralized Motion Tokens

Animation durations and easings used by both platforms SHALL be declared in the shared token source where an equivalent concept exists on both platforms.

#### Scenario: Shared timing value
- **WHEN** a transition duration is defined for an interaction (for example the dot toggle or button feedback)
- **THEN** both platform implementations reference the same declared duration rather than independent numbers
