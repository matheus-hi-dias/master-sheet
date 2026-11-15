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
  index.ts           # type re-exports
```

## Contract rules

- Primitives are controlled: `value` / `onChange`, or `onPress` / `onClick`.
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

## Adding a primitive

A component qualifies only when all of the following are true:

1. It is duplicated on web and native today.
2. Both platforms need the same prop contract.
3. It has no app-specific dependency.
4. A web renderer, a native renderer, and the shared type contract can all be
   added together, with both local copies deleted in the same change.
