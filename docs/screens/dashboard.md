# Screen: Personal Dashboard (My Sheets)

Where the player views, edits, and selects their registered character sheets.

## Web (React + Vite)

**Composition:** Grid of "Character Cards" plus a lateral sidebar for quick access to other routes (Settings, Gallery).

**Behavior:**

- React Query loads and caches the current user's Sheets array.
- Card hover reveals quick-action buttons: Delete, Duplicate, Share Sheet.

**UX/Design:** Robust visual structure with a `<PageHeader>` hero in the serif display face. Continuous card groupings use lean spacing to fill wide horizontal screens. Underlying card actions use the secondary identity: `Btn variant="ghost"` for neutral actions, `Btn variant="danger"` for delete.

## Mobile (React Native + Expo)

**Composition:** Bottom Tabs Navigation (Explore, My Sheets, Profile). Vertical listing via `FlatList` / `FlashList`.

**Behavior:**

- Renders a fluid grid/list of the user's sheets.
- **Pull-to-refresh** forces the React Query cache to re-sync from the database.

**UX/Design:** Taller cards with a highlighted portrait. Vertical scroll with comfortable touch targets (minimum 44×44px).