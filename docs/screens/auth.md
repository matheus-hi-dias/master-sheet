# Screen: Login & Authentication

## Web (React + Vite)

**Composition:** A floating screen container over an interactive radial-gradient glow background. A `Card` sits centered with a gold top margin mark. Fields are stacked `Input` blocks (with the eye-icon password reveal toggle) submitted via `Btn variant="gold"` (or `ghost`). The whole block renders with `animate-fade-in`.

**Behavior:**

- On successful credential exchange with NestJS, the access token is kept **in memory only**; the refresh token is stored by the API as an **HttpOnly, Secure, SameSite cookie** (`master-sheet-refresh-token`).
- Global state (Zustand) updates instantly and redirects to the Dashboard via React Router.
- All feedback uses `Toast` subcomponents (golden pills floating up from the bottom edge via `toast-in`) instead of inline/error modal patterns.

## Mobile (React Native + Expo)

**Composition:** Full-view background; generously spaced `TextInput` fields.

**Behavior:**

- Refresh token persists via **`expo-secure-store`**; access token stays in memory.
- Navigation swaps the whole tree from the "Auth Stack" to the "Main App Stack".
- Native keyboard is leveraged: the email field uses `returnKeyType="next"` to advance focus directly to the password field.

## Related

- Token/session contract: `openspec/specs/authentication/spec.md`
- Endpoints: `docs/api/contracts.md` → Auth module