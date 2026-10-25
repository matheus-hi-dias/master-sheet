# Screen: Tag Management (Dual Scope)

Handles the mechanics of where and which tags can be indexed.

## Web (React + Vite)

**Composition:** Multi-option React-Select component with smart autocomplete whose labels and picks reflect the `Tag` aesthetic — dense opaque/attenuated tones when suggested, flipping to the strong gold stamp once actually added or clicked.

**Behavior:**

- The submission endpoint embeds scope intelligence before sending: Template-scope changes use the global base tag rules; a personal Sheet communicates only with the `SheetTag` scope.

## Mobile (React Native + Expo)

**Composition:** A dedicated modal view focused on tag addition.

**Behavior:**

- Because screen size makes typing while managing simultaneous selections awkward, tapping "Add Tag" opens a clean, dedicated input screen for managing tags, keeping the keyboard from obscuring the original list information.

## Related

- Rules: `openspec/specs/tag-management/spec.md`