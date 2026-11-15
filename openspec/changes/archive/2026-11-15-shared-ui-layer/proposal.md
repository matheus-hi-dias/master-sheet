## Why

The design system is documented once but implemented three times. Tokens are copied across `apps/web/src/index.css` and the pair `apps/mobile/global.css` + `apps/mobile/tailwind.config.js` (177 vs 199 token-class usages), and the drift has already produced a real defect: web declares `Cinzel`/`Lato` in `@theme` but never loads either font, while mobile bundles and loads them. At the component level, `GemLogo` repeats identical SVG geometry, `DotTracker` repeats identical toggle math, and `Button` repeats the same variant/size matrix against different primitives. Deleting the starter `@repo/ui` (in `workspace-hygiene`) is correct, but it leaves no shared visual layer at all.

## What Changes

- Introduce `@master-sheet/design-tokens`: the single source for colors (dark + light), radii, spacing, typography, shadows, and motion tokens. It emits CSS custom properties, a Tailwind 4 `@theme` fragment, a NativeWind/Tailwind preset, and typed TS constants from one definition.
- Move the Cinzel/Lato font assets and their family/weight manifest into the shared package; web loads them via `@font-face` and mobile via `expo-font`, fixing the missing web fonts.
- Reintroduce `@master-sheet/ui` as a **selective, platform-split** primitive package rather than a DOM library: `GemLogo`, `Button`, `Tag`, `DotTracker`, and later `Input`. Each primitive ships a web implementation and a native implementation behind the same import specifier and the same prop contract.
- Standardize primitives on a controlled interface (`value` / `onChange`) with no React Hook Form, React Query, or app-specific dependency. Web adapts RHF through `Controller`; mobile already uses controlled props.
- Explicitly **not** share: feature components (`Builder*`, `DynamicFormMapper`, `DynamicSheetRenderer`, `Repeater*`, `NumberStepper`, `FormulaField`), layouts (`Sidebar`, `BottomNav`, `DashboardLayout`), form mappers, and toast implementations.
- Add per-primitive parity tests (behavior + accessibility) and a token drift check so future divergence fails CI.

## Capabilities

### New Capabilities

- `design-tokens`: Defines the single source of truth for visual tokens and font assets, how each platform consumes them, and the requirement that token changes propagate without app-level edits.
- `shared-ui-primitives`: Defines which primitives are shared, how one import specifier resolves to per-platform implementations, the controlled prop contract, accessibility parity, and the boundary that keeps feature components app-local.

### Modified Capabilities

<!-- None. No domain/runtime behavior in openspec/specs/ changes; this is the visual layer. -->

## Impact

- New packages: `packages/design-tokens`, `packages/ui` (`@master-sheet/ui`).
- Modified apps: `apps/web/src/index.css` (consume generated theme), `apps/web/index.html` (font loading), `apps/web/src/components/ui/{Button,GemLogo,Tag}.tsx` and `features/sheets/components/DotTracker.tsx` (delegate to shared primitives); `apps/mobile/tailwind.config.js`, `apps/mobile/global.css`, `apps/mobile/app/_layout.tsx` (consume tokens/fonts), `apps/mobile/components/{Button,GemLogo}.tsx` and `components/sheet/DotTracker.tsx` (delegate).
- Tooling: package `exports` conditions (`react-native` vs default), Vite resolution check, Metro resolution check, per-platform Jest projects, `turbo.json` build graph, Dependabot entry for the two packages.
- Docs: `docs/design-system.md` becomes a consumer-facing description of the generated tokens instead of a hand-maintained mirror.
- Risk: this is the only change that introduces cross-platform component resolution; it must be phased (tokens first, pure-SVG primitive next) so a resolution problem cannot block the whole layer.
