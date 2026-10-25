# Mobile (Expo / React Native) App Instructions

App-scoped conventions for `apps/mobile`. Global rules live in the repository root `AGENTS.md`; design/screen specs live in `docs/design-system.md` and `docs/screens/*.md`.

## Stack

Expo 55 (React Native 0.83), NativeWind, Expo Router (file-based navigation), React Query, `expo-secure-store` (refresh token storage), lucide-react-native, reanimated.

## Conventions

- **Native-only mindset:** never introduce DOM-dependent packages (`react-router-dom`, direct `window` access).
- **Dense lists:** use `FlatList` / `FlashList` — never a plain `ScrollView` for large datasets.
- **Sheet rendering:** render one `Template.structure` tab at a time to avoid render bottlenecks; swipeable/segmented tabs for sections.
- **Session:** access token in memory; refresh token in `expo-secure-store`, session restored on bootstrap when still valid.
- **Offline-first:** Optimistic UI updates with rollback via React Query, mirroring both platforms (`docs/screens/offline.md`).
- **Performance:** touch targets ≥44×44px; dynamic keyboard types per JSON field type.

## Commands

- Start: `pnpm --filter mobile start` · Android: `pnpm --filter mobile android`
- Clear bundler cache when needed: `pnpm --filter mobile exec expo start --clear`