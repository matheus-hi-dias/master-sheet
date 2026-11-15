# Design System

Global design tokens, typography, shared primitives, and motion for Master-Sheet. Tokens are defined once in `packages/design-tokens`; shared visual primitives live in `packages/ui`. Web (Tailwind CSS 4) and Mobile (NativeWind) consume the generated artifacts instead of restating values.

## Token Source

`packages/design-tokens/src/tokens.ts` is the single source of truth for colors, themes, radii, spacing, typography, shadows, motion, and font assets.

Generated artifacts (do not edit by hand):

| Artifact                                          | Consumer                                               |
| :------------------------------------------------ | :----------------------------------------------------- |
| `generated/tokens.css`                            | Mobile `global.css`                                    |
| `generated/web-theme.css`                         | Web `index.css` Tailwind `@theme` fragment             |
| `generated/fonts.css` + `apps/web/public/fonts/*` | Web `@font-face` and served font files                 |
| `generated/tailwind-preset.cjs`                   | Mobile `tailwind.config.js`                            |
| `generated/tokens.ts`                             | Typed constants (`@master-sheet/design-tokens/tokens`) |
| `generated/font-manifest.js`                      | Mobile `useFonts`                                      |
| `generated/tokens.json`                           | Drift and snapshot checks                              |

Commands:

- Regenerate: `pnpm tokens:generate`
- Verify freshness: `pnpm tokens:check`
- Verify app styles contain no literal token colors: `pnpm check:token-drift`

## Visual Language

The product is fundamentally **dark-first, immersive, and utility-driven**. Panels sit on a near-black canvas, foreground blocks uplift one stop at a time, and communicative color is reserved for gold. Interaction is shimmery and precise: focus produces golden borders, notifications float up as pills, dice roll into place with a fake 3D spin.

## Color Tokens

Semantic groups are defined in `packages/design-tokens/src/tokens.ts` and exposed as CSS custom properties:

- Surfaces: `--color-bg-app`, `--color-bg-panel`, `--color-bg-card`
- Text: `--color-text-main`, `--color-text-muted`
- Identity: `--color-gold`, `--color-gold-dim`, `--color-gold-tint`, `--color-on-gold`
- Status: `--color-border`, `--color-danger`, `--color-danger-tint`, `--color-success`, `--color-warning`, `--color-link`

Both themes are generated from the same source: dark values are the `:root` defaults and light values are `.light` overrides. Apps must reference the variables or generated utilities, never literal hex/rgb values.

Rules:

- Interactive components (`Button variant="gold"`, focused `Input`) adopt gold.
- Borders "activate" into golden ratios on focus, or stay neutral at rest.

## Typography

- **Cinzel** — display/hero text and RPG numeric readouts.
- **Lato** — body and base UI text.
- Font families, weights, and files come from the generated font manifest; web serves the files from `apps/web/public/fonts` and mobile loads them through `useFonts`.
- Small labels (`SectionLabel`) are always `uppercase` with wide spacing (`tracking-[0.1em]`).

## Motion & Animation

| Token             | Behavior                                                    |
| :---------------- | :---------------------------------------------------------- |
| `animate-fade-in` | Soft rise + fade on screen entry.                           |
| `dice-in`         | Fake 3D rotational roll used for dice interaction feedback. |
| `toast-in`        | Bottom pop-up rise for global notifications.                |

Durations and easings are exposed as `--motion-duration-*` and `--motion-easing-*` custom properties from the token source.

## Shared Primitives

Only primitives that are duplicated on both platforms and share one prop contract live in `@master-sheet/ui`:

| Primitive    | Import                         |
| :----------- | :----------------------------- |
| `GemLogo`    | `@master-sheet/ui/gem-logo`    |
| `Button`     | `@master-sheet/ui/button`      |
| `Tag`        | `@master-sheet/ui/tag`         |
| `DotTracker` | `@master-sheet/ui/dot-tracker` |

Each import resolves to the web renderer in Vite and the native renderer in Metro. See `packages/ui/README.md` for the platform-file convention and the sharing boundary.

### Button

Golden-ratio identity. Variants: `gold` (primary), `outline`, `ghost` (secondary/neutral), and `danger` (destructive).

### Input

App-local for now. Dark, bordered field. Focus reveals a gold border. Passwords support an eye icon reveal/occlude toggle on web; mobile parity is not defined yet.

### SectionLabel

Uppercase, `tracking-[0.1em]` gold-tinged label used to categorize extended sheet domains, drawn over a bottom boundary line.

### Tag

Pill-shaped label. The `filter` variant is the interactive discovery chip; the `display` variant is the compact metadata pill.

### Toast

Global notification; a golden pill suspended and centered near the bottom edge of the viewport, entering via `toast-in`.

### PageHeader

Robust page-title block; hero title rendered in the serif display face.

### DiceOverlay

Full-screen focus-lock overlay for dice checks. A large glowing golden number enters the center matrix via the fast `dice-in` micro-interaction.

### FAB (Mobile)

Floating Action Button, rounded, solid gold brand tone, with flexible shaded response to focus and `hover:scale-110`. Dedicated to the contextual "Quick Roll" convenience (see `docs/screens/editor.md`).

## Responsive & Platform Behavior

- Web favors horizontal space: wide grids, sidebars, multi-column card listings.
- Mobile gives vertical space primacy: labels above inputs, single-tab rendering, bottom tabs.
- Touch targets are comfortable — 44×44px minimum on Mobile.
- Follow `docs/screens/*.md` for exact per-screen arrangement.
