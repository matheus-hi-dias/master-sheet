# Shared UI Layer — Parity Baseline

Captured before the token/primitive extraction so regressions can be compared
against the values that shipped in `apps/web` and `apps/mobile`.

## 1.1 Token inventory

| Concept          | Web (`apps/web/src/index.css`)              | Mobile (`apps/mobile/global.css`) | Mobile (`apps/mobile/tailwind.config.js`) | Reconciled source key |
| ---------------- | ------------------------------------------- | --------------------------------- | ----------------------------------------- | --------------------- |
| App background   | `--color-bg-app` `#121212`                  | `--color-bg-app` `#121212`        | `bg.app`                                  | `bgApp`               |
| Panel background | `--color-bg-panel` `#1a1a1b`                | `--color-bg-panel` `#1a1a1b`      | `bg.panel`                                | `bgPanel`             |
| Card background  | `--color-bg-card` `#242424`                 | `--color-bg-card` `#242424`       | `bg.card`                                 | `bgCard`              |
| Main text        | `--color-text-main` `#e0e0e0`               | `--color-text-main` `#e0e0e0`     | `text.main`                               | `textMain`            |
| Muted text       | `--color-text-muted` `#888888`              | `--color-text-muted` `#888888`    | `text.muted`                              | `textMuted`           |
| Gold             | `--color-gold` `#d4af37`                    | `--color-gold` `#d4af37`          | `gold.DEFAULT` `#d4af37`                  | `gold`                |
| Dim gold         | `--color-gold-dim` `#9a7d26`                | `--color-gold-dim` `#9a7d26`      | `gold.dim` `#9a7d26`                      | `goldDim`             |
| Border           | `--color-border` `#3d3d3d`                  | `--color-border` `#3d3d3d`        | `border` `#3d3d3d`                        | `border`              |
| Danger           | `--color-danger` `#c0392b`                  | `--color-danger` `#c0392b`        | `danger` `#c0392b`                        | `danger`              |
| Success          | `--color-success` `#27ae60`                 | `--color-success` `#27ae60`       | `success` `#27ae60`                       | `success`             |
| Warning          | `--color-warning` `#e67e22`                 | `--color-warning` `#e67e22`       | `warning` `#e67e22`                       | `warning`             |
| Link             | —                                           | —                                 | `link` `#2e78b7`                          | `link`                |
| Display font     | `--font-display` `'Cinzel', serif`          | —                                 | `fontFamily.display: ['Cinzel']`          | `typography.display`  |
| Body font        | `--font-body` `'Lato', sans-serif`          | —                                 | `fontFamily.body: ['Lato']`               | `typography.body`     |
| Card radius      | `--radius-card` `8px`                       | `--radius-card` `8px`             | `borderRadius.card` `8px`                 | `radii.card`          |
| Card shadow      | `--shadow-card` `0 4px 24px rgba(0,0,0,.5)` | —                                 | —                                         | `shadows.card.dark`   |
| Aura gradient    | `--background-image-aura` radial gold fade  | —                                 | —                                         | `auraGradient`        |

Reconciliation notes:

- The only value present on mobile but absent on web is `link` (`#2e78b7`).
- The only visual values present on web but absent on mobile are the card shadow
  and the aura background image.
- Mobile duplicated the gold/border/status colors as literals in
  `tailwind.config.js` while `global.css` declared the same values as custom
  properties. The shared source removes that second declaration.

## 1.2 Rendered parity baseline

Dark (default) values on both platforms:

| Token         | Value                           |
| ------------- | ------------------------------- |
| `bg-app`      | `#121212`                       |
| `bg-panel`    | `#1a1a1b`                       |
| `bg-card`     | `#242424`                       |
| `text-main`   | `#e0e0e0`                       |
| `text-muted`  | `#888888`                       |
| `gold`        | `#d4af37`                       |
| `gold-dim`    | `#9a7d26`                       |
| `border`      | `#3d3d3d`                       |
| `danger`      | `#c0392b`                       |
| `success`     | `#27ae60`                       |
| `warning`     | `#e67e22`                       |
| `radius-card` | `8px`                           |
| `shadow-card` | `0 4px 24px rgba(0, 0, 0, 0.5)` |

Light (`.light`) values on both platforms:

| Token         | Value                           |
| ------------- | ------------------------------- |
| `bg-app`      | `#faf9f6`                       |
| `bg-panel`    | `#f0efea`                       |
| `bg-card`     | `#ffffff`                       |
| `text-main`   | `#2d3436`                       |
| `text-muted`  | `#636e72`                       |
| `gold`        | `#b8860b`                       |
| `gold-dim`    | `#8b6914`                       |
| `border`      | `#dcd7c9`                       |
| `danger`      | `#c0392b` (unchanged)           |
| `success`     | `#27ae60` (unchanged)           |
| `warning`     | `#e67e22` (unchanged)           |
| `shadow-card` | `0 4px 12px rgba(0, 0, 0, 0.1)` |

Known pre-existing divergence: mobile's `gold` Tailwind entry was a literal, so
it did not follow the light theme. The shared preset resolves that by making the
mobile gold utility consume the same custom property as web.

## 1.3 Web font defect

Confirmed. `apps/web/src/index.css` declares `--font-display: 'Cinzel'` and
`--font-body: 'Lato'`, but `apps/web/index.html` loads no font stylesheet and
`index.css` declares no `@font-face`. The browser therefore falls back to the
generic `serif` / `sans-serif` families. Mobile already bundles
`assets/fonts/Cinzel-VariableFont_wght.ttf` and `Lato-Regular.ttf` and registers
them through `useFonts` in `apps/mobile/app/_layout.tsx`.

## 1.4 Duplicated primitives

| Primitive    | Web path                                                 | Mobile path                                           |
| ------------ | -------------------------------------------------------- | ----------------------------------------------------- |
| `GemLogo`    | `apps/web/src/components/ui/GemLogo.tsx`                 | `apps/mobile/components/GemLogo.tsx`                  |
| `Button`     | `apps/web/src/components/ui/Button.tsx`                  | `apps/mobile/components/Button.tsx`                   |
| `Tag`        | `apps/web/src/components/ui/Tag.tsx`                     | inline pill in `apps/mobile/app/(tabs)/templates.tsx` |
| `DotTracker` | `apps/web/src/features/sheets/components/DotTracker.tsx` | `apps/mobile/components/sheet/DotTracker.tsx`         |
| `Input`      | `apps/web/src/components/ui/Input.tsx`                   | `apps/mobile/components/Input.tsx` — **out of scope** |

`Input` remains app-local: web exposes password reveal and a hover tooltip that
mobile does not implement, so sharing it now would silently drop behavior.
