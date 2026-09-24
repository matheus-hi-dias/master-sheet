# Screen: Template Gallery (Discovery & Community)

Where users find predefined "rules and sheet skeletons" (e.g. D&D 5e, Call of Cthulhu).

## Web (React + Vite)

**Composition:** Advanced search bar plus multi-select "pill" filters bound to global tags. A modal for preview.

**Behavior:**

- The search consumes the backend and filters Templates where `isPublic: true`.
- Clicking "Preview" loads a mock read-only sheet **without registering ownership** in the database, letting the user inspect the JSON structure tree.

**UX/Design:** Uses the `Tag` component's dual styling — attenuated opaque tones for available/suggested filters, strong gold for active selections.

## Mobile (React Native + Expo)

**Composition:** Infinite paginated list (`onEndReached`). Horizontal filter chip carousel in the header.

**Behavior:**

- Scrolling through thousands of sheets is paginated to conserve memory and network.
- Tapping a Template opens a `BottomSheet` modal with details and a "Create a new Sheet from this Template" action.

## Notes

- Server-side search, system filtering, and pagination are part of the in-progress template-engine change (`openspec/changes/multi-system-rpg-template-engine/`). The current API supports `tags` and `isPublic` filters.