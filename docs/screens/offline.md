# Screen: Slow Sync & Offline State

Shared behavior across Web and Mobile.

RPG campaigns often run where connectivity is poor. The app must therefore follow offline-first principles:

- **Optimistic UI Updates:** mutate attributes, texts, or items visually **immediately** — during or before submission to NestJS. When the request completes successfully, the interface never stalls.
- **Rollback on Error:** if a `fetch`/`axios` request errors, the system automatically reverts the client side (React Query state for Web and Mobile) to the same safe data snapshot that existed before the user action.

## Related

- `openspec/specs/sheet-engine/spec.md` → Optimistic UI & Rollback requirement
- Mobile token/session persistence: `docs/screens/auth.md`