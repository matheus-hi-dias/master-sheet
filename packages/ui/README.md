# `@master-sheet/ui`

Selective, platform-split primitives shared by the Master-Sheet web and mobile
apps. The package exists to remove duplicated visual implementations, not to
become a general component dumping ground.

## Sharing boundary

Shared here:

- `GemLogo`
- `Button`
- `Tag`
- `DotTracker`

**Not** shared here (and must stay app-local unless a new proposal redefines
the boundary):

- Feature components: `Builder*`, `DynamicFormMapper`, `DynamicSheetRenderer`,
  `RepeaterField`, `RepeaterList`, `NumberStepper`, `FormulaField`
- Layouts: `Sidebar`, `BottomNav`, `DashboardLayout`
- Form mappers and toast implementations
- `Input`: web currently exposes password reveal and a hover tooltip that
  mobile does not implement. It stays app-local until that parity is defined.

## Platform-file convention

Every primitive is imported through one specifier and resolves per platform
through package `exports` conditions:

```ts
import { Button } from '@master-sheet/ui/button';
```

```jsonc
"./button": {
  "types": "./src/button/types.ts",
  "react-native": "./src/button/button.native.tsx",
  "default": "./src/button/button.web.tsx"
}
```

- Metro/Expo resolves `react-native`.
- Vite resolves `default`.
- TypeScript resolves `types`, so both implementations are checked against the
  same prop contract.

Each primitive directory contains:

```
button/
  types.ts           # shared props + variant/size unions + declared component
  classes.ts         # token-backed class lookups (optional)
  button.web.tsx     # DOM implementation
  button.native.tsx  # React Native implementation
```

The per-directory `index.ts` re-export files were removed: `exports` already
maps `types` straight to `types.ts`, so they were dead code.

## Build and consumption

The `exports` map points every runtime entry at `src/**`, so consumers compile
the package sources with their own toolchain:

- Vite (web) and Metro/Expo (mobile) transform `src/**` on the fly — there is no
  dev-time build step and no stale `dist` to invalidate.
- `build` still emits `dist/**` (gitignored) because it is the only artifact the
  Node unit tests can import (`test/dot.test.mjs` loads `../dist/shared/dot.js`
  so the same code runs on Node 20 without a TypeScript loader).

Consequence: **the package must be listed in the consumer's styling scan.**
Tailwind/NativeWind only generate utilities for files they read, so both apps
include `packages/ui/src`:

- web: `@source '../../../packages/ui/src';` in `apps/web/src/index.css`
- mobile: `content: ['../../packages/ui/src/**/*.{ts,tsx}']` in
  `apps/mobile/tailwind.config.js`

`scripts/check-web-bundle.mjs` asserts that utilities only defined here (for
example `.text-on-gold`) make it into the web build, so a missing `@source` fails
CI instead of shipping unstyled primitives.

## Contract rules

- Primitives are controlled: `value` / `onChange`, or `onPress` / `onClick`.
- `Tag variant="display"` is non-interactive metadata: `onPress` / `onClick` are
  ignored on both platforms, and it renders without a button role or tab stop.
- No React Hook Form, React Query, Zustand or application imports.
- Web form bindings use `<Controller>` in the app; the primitive never imports
  the form library.
- `cn` with `tailwind-merge` stays app-local. The package only joins class
  names because `tailwind-merge` has not been validated against NativeWind
  semantics.
- Layout classes stay per-platform; only token lookups (colors, borders,
  radii) are shared.
- React, React Native and `react-native-svg` are peer dependencies. The package
  never vendors React.
- **Platform-specific props are not forwarded.** The shared `Button` contract
  does not spread `ButtonHTMLAttributes` or `PressableProps`: `ref`, `form`,
  `title`, `aria-describedby`, `onLongPress` and `hitSlop` are intentionally
  unreachable. If a consumer needs one, add it to the shared `types.ts` so both
  renderers can honour it. The web `Button` keeps `forwardRef` at runtime (so
  focus management keeps working) but `ref` is not part of the shared contract
  until a cross-platform handle is defined.

## Adding a primitive

A component qualifies only when all of the following are true:

1. It is duplicated on web and native today.
2. Both platforms need the same prop contract.
3. It has no app-specific dependency.
4. A web renderer, a native renderer, and the shared type contract can all be
   added together, with both local copies deleted in the same change.
