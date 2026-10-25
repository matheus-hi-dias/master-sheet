# Design System

Global design tokens, typography, components, and motion for Master-Sheet. These are enforced by Web (Tailwind CSS 4) and mirrored by Mobile (NativeWind). All screens reference these primitives.

## Visual Language

The product is fundamentally **dark-first, immersive, and utility-driven**. Panels sit on a near-black canvas, foreground blocks uplift one stop at a time, and communicative color is reserved for gold. Interaction is shimmery and precise: focus produces golden borders, notifications float up as pills, dice roll into place with a fake 3D spin.

## Color Tokens

| Token                | Hex       | Usage                                                       |
| :------------------- | :-------- | :---------------------------------------------------------- |
| `--color-bg-app`     | `#121212` | Global application background.                              |
| `--color-bg-panel`   | `#1A1A1B` | Supporting panels and side surfaces.                        |
| `--color-bg-card`    | `#242424` | Foreground cards and raised boxes.                          |
| Text primary         | `#E0E0E0` | Primary copy.                                               |
| Text muted           | `#888888` | Secondary / muted copy.                                     |
| `--color-gold`       | `#D4AF37` | Primary communicative identity: interactive accents and focus. |
| Border neutral       | `#3D3D3D` | Inactive borders / dividers.                                |

Rules:

- Interactive components (`Btn variant="gold"`, focused `Input`) adopt gold.
- Borders "activate" into golden ratios on focus, or stay neutral (`#3D3D3D`) at rest.

## Typography

- **Cinzel** — display/hero text and RPG numeric readouts.
- **Lato** — body and base UI text.
- Small labels (`SectionLabel`) are always `uppercase` with wide spacing (`tracking-[0.1em]`).

## Motion & Animation

| Token                  | Behavior                                                        |
| :--------------------- | :-------------------------------------------------------------- |
| `animate-fade-in`      | Soft rise + fade on screen entry.                               |
| `dice-in`              | Fake 3D rotational roll used for dice interaction feedback.     |
| `toast-in`             | Bottom pop-up rise for global notifications.                    |

## Core Components

### Btn

Golden-ratio identity. Variants:

- `variant="gold"` — primary affirmative actions.
- `variant="ghost"` — secondary / neutral actions (e.g. card quick actions).
- `variant="danger"` — destructive actions (e.g. delete).

### Input

Dark, bordered field. Focus reveals a gold border. Passwords support an eye icon reveal/occlude toggle.

### SectionLabel

Uppercase, `tracking-[0.1em]` gold-tinged label used to categorize extended sheet domains, drawn over a bottom boundary line.

### Tag

Pill-shaped label. Suggested/available tags render attenuated opaque tones; added/active tags adopt the strong gold imprint.

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