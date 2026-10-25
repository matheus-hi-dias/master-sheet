## Context

Verified duplication (component-level diff):

| Concern | Web | Mobile | Shareable |
|---|---|---|---|
| Tokens | `apps/web/src/index.css:4-24` (`@theme`) | `apps/mobile/global.css:8-34` + `tailwind.config.js:10-24` | Yes — data only |
| Fonts | `--font-display`/`--font-body` declared, never loaded | `assets/fonts/*.ttf` + `useFonts` (`app/_layout.tsx:20`) | Yes — assets + manifest |
| GemLogo | inline SVG, `GemLogo.tsx:11` | `react-native-svg`, `GemLogo.tsx:32`, same points | Yes — platform split |
| Button | `<button>` + `cn` | `<Pressable>` + `<Text>` | Yes — platform split |
| Tag | `components/ui/Tag.tsx` | inline pill (`app/(tabs)/templates.tsx:184`) | Yes — platform split |
| DotTracker | DOM buttons, same `setDot` (`:14`) | Pressable, same `setDot` (`:14`) | Yes — platform split |
| Input | `<input>`, password/tooltip | `<TextInput>`, no parity | Later — contract only |
| FieldInput / DynamicFormMapper | RHF `register` | controlled `value/onChange` | No |
| FormulaField / Repeater / NumberStepper | per-platform | per-platform | No |
| Layouts, Toast | per-platform | per-platform | No |
| Icons | `lucide-react` | `lucide-react-native` | Optional — not in scope |

Constraints: web is a Tailwind 4 DOM SPA (Vite); mobile is NativeWind + Expo/Metro; `apps/mobile/.npmrc` uses hoisted node_modules for Metro; both already share the Tailwind class vocabulary but differ in interaction variants (`hover:` vs `active:`) and layout defaults.

## Goals / Non-Goals

**Goals:**

- One definition of tokens and fonts, consumed by both platforms.
- One implementation of the four currently duplicated primitives, reachable through one import path.
- A controlled primitive contract that fits both form models.
- CI that catches token drift and primitive behavior divergence.

**Non-Goals:**

- Adopting React Native Web in the web app, or rewriting web components as RN primitives.
- Sharing feature components, screen layouts, form mappers, or toast systems.
- A visual regression/storybook pipeline (a follow-up, not required for parity).
- A shared icon wrapper over `lucide-react`/`lucide-react-native`.
- Publishing packages or introducing versioned releases.

## Decisions

### D1 — Tokens are data, emitted three ways

`@master-sheet/design-tokens` exports a plain TS object as the source, and generates:

1. **CSS custom properties** (`tokens.css`) for web and RN `global.css` consumption.
2. **Tailwind theme fragment** for web's `@theme` (Tailwind 4 CSS-first) and a **preset** for mobile's `tailwind.config.js`.
3. **Typed constants** for code that cannot use CSS variables (for example `react-native-svg` props, `placeholderTextColor`, animation durations).

Both themes (`dark` default, `.light` overrides) are defined once. Generated files are committed (so Metro/Vite need no build step before dev) and a CI check re-generates and fails on diff.

Alternative considered: sharing only a Tailwind preset. Rejected because mobile needs JS values for SVG/animation props and web needs CSS variables for theme switching.

### D2 — No React Native Web; use platform-split files

The web app stays DOM-based. Shared primitives are thin adapters:

```
packages/ui/src/button/
  index.ts           # re-export / type surface
  button.web.tsx     # <button> + cn + web a11y
  button.native.tsx  # <Pressable>/<Text> + NativeWind
  types.ts           # shared props + variant/size unions
```

Rejected alternative: convert web to `react-native-web` and share RN components directly. It would unify the stack but requires rewriting every web component, re-validating layout/hover behavior, and changing the Vite pipeline — disproportionate to the duplication.

### D3 — One import specifier via `exports` conditions

```jsonc
// packages/ui/package.json
"exports": {
  "./button": {
    "react-native": "./src/button/button.native.tsx",
    "types": "./src/button/types.ts",
    "default": "./src/button/button.web.tsx"
  }
}
```

- Metro/Expo resolves the `react-native` condition.
- Vite resolves `default` (or configure `resolve.conditions` to include `browser`).
- TypeScript resolves `types`, so both platforms are checked against one prop interface.
- Surface this with a single documented import: `import { Button } from '@master-sheet/ui/button'`.

Alternative considered: `.web.tsx`/`.native.tsx` inside the *app* and a Vite `resolve.extensions` override. Rejected because it duplicates the component in both apps, which is exactly the problem being solved.

### D4 — Phased primitive adoption

- **Phase 1:** `GemLogo` (pure geometry, no interaction) to prove dual resolution end-to-end.
- **Phase 2:** `Button` and `Tag` (same variant/size matrix, no state).
- **Phase 3:** `DotTracker` (shared pure `toggleDotValue` + two renderers).
- **Phase 4 (optional):** `Input` only after feature parity is defined (password reveal and tooltip do not exist on mobile today; do not silently drop them on web).

Each migration deletes the local copy in the same commit. No primitive is considered shared while a duplicate still exists.

### D5 — Controlled props, no form-library coupling

Shared primitives accept `value`/`onChange` (or `onPress` for actions) and never import React Hook Form, Zustand, or React Query. Web wraps form-bound usages in `<Controller>`; mobile keeps its existing controlled flow. This keeps `packages/ui` consumable by any future surface (for example the builder preview).

`DotTracker` behavior is extracted as a pure helper (`toggleDotValue(current, index, max)`) shared by both renderers, mirroring the current identical `setDot` logic (`apps/web/.../DotTracker.tsx:14`, `apps/mobile/.../DotTracker.tsx:14`).

### D6 — Share token lookups, not layout classes

Variant/size maps may live in `packages/ui` when they are token lookups (colors, borders, radii). Layout classes (`flex-row`, spacing, breakpoints) stay per-platform because RN layout defaults and `hover`/`active` semantics differ. `cn` (clsx + tailwind-merge) stays per-app initially; adopting it inside the package would require validating `tailwind-merge` against NativeWind class semantics.

### D7 — Fonts are shared assets with a manifest

`packages/design-tokens/fonts/` holds the Cinzel/Lato files and a `fontFamilies` manifest. Web loads them through `@font-face` generated into `tokens.css` (or copied to `public/fonts` by the token build); mobile maps the same files into `useFonts`. The manifest is the only place family names/weights are declared. This closes the current web gap where `font-display: Cinzel` resolves to a fallback serif.

### D8 — Parity tests per primitive

- Token test: generate outputs, compare against committed snapshots.
- Primitive behavior test: shared helper unit tests (for example `toggleDotValue`).
- Render test per platform: web via jsdom/testing-library, native via `jest-expo`/`@testing-library/react-native` once the mobile runner lands (see `workspace-hygiene`).
- Accessibility: both implementations expose equivalent labels (`aria-label` / `accessibilityLabel`).

### D9 — Explicit non-sharing boundary

Feature components remain app-local and are not added to `packages/ui` without a new proposal. Document the boundary in `packages/ui/README.md` so the package does not become a dumping ground like the starter it replaces.

## Risks / Trade-offs

- **[Vite resolves the native file by mistake]** → Phase 1 proves the `exports` conditions with `GemLogo`; add a Vite build assertion that the web bundle does not include `react-native` or `react-native-svg`.
- **[Two React copies break hooks]** → `react` is a peer dependency, never a nested dependency; verify with `pnpm why react`.
- **[NativeWind cannot process classes from `packages/ui`]** → add the package path to mobile's `tailwind.config.js` content globs and verify a rendered class in the native build.
- **[TypeScript sees a different implementation than the runtime]** → both platform files must satisfy the shared `types.ts` (typed as `ComponentType<Props>`); CI typechecks the package against both.
- **[Input parity regression]** → defer Input sharing until password/tooltip behavior is decided; do not ship a shared Input that silently loses web features.
- **[Token generation adds a build step]** → commit generated artifacts and verify freshness in CI; no dev-time codegen required.
- **[Bundle growth on mobile]** → primitives are tiny and tree-shakeable via subpath exports; avoid a barrel index that pulls every primitive.

## Migration Plan

1. Inventory token usage; extract `@master-sheet/design-tokens`; wire web `@theme` and mobile preset to generated files; verify the UI is visually unchanged.
2. Move fonts into the package; add web `@font-face` and switch mobile `useFonts` to the shared manifest; verify Cinzel/Lato render on both.
3. Scaffold `@master-sheet/ui` with `GemLogo`; prove Vite and Metro resolution in both apps.
4. Migrate `Button`, then `Tag`, then `DotTracker`; delete each local copy in the same commit.
5. Add parity/accessibility tests and the token freshness check to CI.
6. Update `docs/design-system.md` and add `packages/ui/README.md` with the sharing boundary.
7. Rollback: tokens are additive and can be reverted independently; primitives revert per component with the local copy restored from the same commit.
