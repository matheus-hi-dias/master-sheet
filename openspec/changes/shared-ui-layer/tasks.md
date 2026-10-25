## 1. Inventory and Baseline

- [ ] 1.1 Inventory every token value used by web (`apps/web/src/index.css`) and mobile (`apps/mobile/global.css`, `apps/mobile/tailwind.config.js`) and reconcile the three lists
- [ ] 1.2 Record the current rendered values for dark and light themes on both platforms as the parity baseline
- [ ] 1.3 Confirm the web font defect: verify `Cinzel`/`Lato` currently resolve to fallbacks because no font is loaded
- [ ] 1.4 List every duplicated primitive and its local file paths (`GemLogo`, `Button`, `Tag`, `DotTracker`) and confirm `Input` stays out of scope

## 2. `@master-sheet/design-tokens`

- [ ] 2.1 Create `packages/design-tokens` with a typed token source (colors, themes, radii, spacing, typography, shadows, motion) and shared build config
- [ ] 2.2 Implement generation of CSS custom properties, the web Tailwind `@theme` fragment, the NativeWind/Tailwind preset, and typed TS constants
- [ ] 2.3 Add light-theme overrides to the single source and confirm they match the current web and mobile values
- [ ] 2.4 Add an idempotence test (generate twice, compare) and commit the generated artifacts
- [ ] 2.5 Add a CI freshness check that regenerates and fails on diff

## 3. Wire Tokens into Both Apps

- [ ] 3.1 Replace the hard-coded `@theme` block in `apps/web/src/index.css` with the generated web fragment
- [ ] 3.2 Replace the token values in `apps/mobile/global.css` and the color/radius/font maps in `apps/mobile/tailwind.config.js` with the generated preset
- [ ] 3.3 Add `packages/design-tokens` to mobile's Tailwind content globs if it emits classes
- [ ] 3.4 Verify dark and light themes are visually unchanged on web and mobile against the baseline
- [ ] 3.5 Add a drift check that flags literal token values declared in app styles

## 4. Shared Fonts

- [ ] 4.1 Move the Cinzel/Lato font files and a family/weight manifest into `packages/design-tokens`
- [ ] 4.2 Generate/copy web `@font-face` declarations and serve the files from the web public path
- [ ] 4.3 Switch `apps/mobile/app/_layout.tsx` `useFonts` to read the shared manifest and files
- [ ] 4.4 Verify the display and body fonts render on web and mobile (no fallback serif on web)

## 5. Scaffold `@master-sheet/ui`

- [ ] 5.1 Create `packages/ui` with `exports` conditions (`react-native` → `.native`, `default` → `.web`, `types` → shared types)
- [ ] 5.2 Declare `react`, `react-native`, and `react-native-svg` as peer dependencies (no vendored React)
- [ ] 5.3 Add `build`, `lint`, `check-types`, and `test` scripts and wire the package into `turbo.json`
- [ ] 5.4 Implement `GemLogo` as the pilot primitive with identical geometry sourced from shared constants and per-platform renderers
- [ ] 5.5 Prove resolution: web build contains no `react-native`/`react-native-svg`; mobile bundle contains the native renderer
- [ ] 5.6 Add a test that both platform implementations satisfy the shared props type

## 6. Migrate Primitives

- [ ] 6.1 Migrate `Button` to the shared package with the shared variant/size union and token-backed class maps; delete both local files
- [ ] 6.2 Migrate `Tag` to the shared package, including the inline mobile pill in `app/(tabs)/templates.tsx`; delete the web local file
- [ ] 6.3 Extract `toggleDotValue` into a pure shared helper with unit tests, then migrate `DotTracker` and delete both local files
- [ ] 6.4 Replace web form bindings with `Controller` where a shared primitive is used inside React Hook Form
- [ ] 6.5 Verify every migrated primitive's visual output against the baseline on both platforms
- [ ] 6.6 Leave `Input` app-local and document the parity work required before sharing it

## 7. Testing and CI

- [ ] 7.1 Add token snapshot tests for the generated artifacts
- [ ] 7.2 Add web render tests (jsdom/testing-library) for each shared primitive
- [ ] 7.3 Add native render tests (`jest-expo`/`@testing-library/react-native`) for each shared primitive, coordinated with the mobile test runner task
- [ ] 7.4 Add accessibility assertions for labels/roles on both platforms
- [ ] 7.5 Add a CI check that fails if a shared primitive has a duplicate local implementation
- [ ] 7.6 Verify `pnpm why react` shows one React instance per app and no nested React in `packages/ui`

## 8. Documentation and Governance

- [ ] 8.1 Rewrite `docs/design-system.md` to describe the generated token source and link to the package instead of restating values
- [ ] 8.2 Add `packages/ui/README.md` documenting the sharing boundary (primitives only) and the platform-file convention
- [ ] 8.3 Add a Dependabot entry for `packages/design-tokens` and `packages/ui`
- [ ] 8.4 Note the workspace convention in `AGENTS.md`: tokens are generated, primitives are controlled, feature components stay app-local

## 9. Verification

- [ ] 9.1 Run `pnpm lint && pnpm check-types && pnpm test && pnpm build` across the workspace
- [ ] 9.2 Build the web bundle and assert no React Native modules are included
- [ ] 9.3 Run the mobile app on an emulator and confirm tokens, fonts, and the three migrated primitives render correctly
- [ ] 9.4 Change one token value and confirm both platforms reflect it with no app edits
- [ ] 9.5 Re-run `openspec validate shared-ui-layer --type change --strict`
