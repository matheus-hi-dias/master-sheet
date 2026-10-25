# Screen: Sheet Editor (Creation & Editing — Main Screen)

The heart of the app. The engine reads `Template.structure` (JSON) and assembles a dynamic UI wired to the current status of `Sheet.data`.

## Web (React + Vite)

**Composition:** Custom top/side tabs (e.g. Attributes, Skills, Equipment). Recursive component engine.

**Behavior:**

- **Dynamic Form Mapper:** each mapped field in the JSON is rendered dynamically through the recursive engine, applying the field's stipulated logic (min/max, options, formulas, repeaters).
- Sheet filling autosaves (`debounce`), dispatching React Query mutations on changes.

**UX/Design:** Clean, modular layout guided by the structure. Extended domains are demarcated by refined `<SectionLabel>` category headers — uppercase, gold-tinged, drawn over the bottom border line. Clicking an attribute block opens the `<DiceOverlay>`: a focus-locked screen where a large glowing golden number vibrates into the page center via the fast `animate-dice-in` micro-interaction.

## Mobile (React Native + Expo)

**Composition:** Swipeable Tabs. Vertical space takes primacy.

**Behavior:**

- The JSON structure renders one tab at a time to prevent render bottlenecks and UI-thread stalling.
- A global **`<FAB>`** is anchored to the bottom trailing edge — rounded, massive, gold, with a shadowed response on focus and `hover:scale-110`. Dedicated to "Quick Roll", analyzing the user's inventory/status for intermittent active tests.

**UX/Design:** Layout adapts: labels read above the boxes (`TextField`) rather than beside them. The keyboard opens dynamically based on the JSON field typing (e.g. numeric keyboard for number fields).

## Related

- `docs/api/contracts.md` → Sheets module (planned endpoints)
- `docs/screens/offline.md` for autosave/rollback behavior