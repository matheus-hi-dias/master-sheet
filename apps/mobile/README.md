# Mobile

## Workspace task contract

This workspace intentionally does **not** define a `build` script. Native binaries are produced by EAS/Expo (`eas build`, `expo run:*`) rather than by the monorepo task graph, so `pnpm turbo run build` skips this app by design. `lint`, `check-types`, and `test` are required and run from the repository root.

## TypeScript configuration

This app extends both `@master-sheet/typescript-config/base.json` and `expo/tsconfig.base.json`, in that order. The Expo config must win for `module`, `moduleResolution`, `target`, `lib`, and `jsx`, because Metro expects Expo's React Native resolution. The shared base only contributes strictness (`strict`, `forceConsistentCasingInFileNames`, `isolatedModules`, `noFallthroughCasesInSwitch`); replacing Expo's module resolution with the Node-oriented base would break the mobile build.

## ESLint configuration

This app keeps an app-local `eslint.config.mjs` instead of consuming `@master-sheet/eslint-config`. Expo and React Native need their own globals, JSX settings, and platform-specific ignores; the shared base targets web/server TypeScript and would require the same overrides here. The local config still layers `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, and the React Hooks ruleset.

## pnpm linker

Metro is the most symlink-sensitive consumer in this monorepo, so `apps/mobile/.npmrc` retains `node-linker=hoisted` as the documented Metro exception. The root install is intentionally isolated: hoisting the entire workspace let the API's Jest 30 shadow the mobile app's Jest 29 and broke the Expo test preset. If you change native dependencies, verify the resulting `node_modules` layout and bundling before shipping.

## Mobile Auth

The mobile client uses the API's token-rotation flow.

- Access tokens stay in memory only.
- Refresh tokens are stored in `expo-secure-store` and used to bootstrap the session after app restart.
- Logout clears both in-memory state and secure storage.
- Verification and password-reset links are still issued by the API, and can be opened from the device.

The API rejects expired, revoked, and replayed tokens, so the app should treat a failed refresh as a sign to clear local auth state.

## Deep Linking & Universal Links

The mobile app is configured to handle deep links and universal links for email verification.

### Configuration

- **Scheme**: `mobile://`
- **Universal Links**:
  - `https://api.mastersheet.com/auth/verify-email` (intercepts API one-click links)
  - `https://mastersheet.com/email-verified` (intercepts web landing page redirects)

### Environment Variables

Ensure `EXPO_PUBLIC_API_URL` is set to your API endpoint (e.g., `http://10.0.2.2:3000` for Android emulator).

### Email Verification Flow

1. **One-Click**: User clicks link in email.
2. **Interception**: If the app is installed, it intercepts the link.
3. **In-App Verification**: The `app/auth/verify-email.tsx` screen extracts the `token` and calls `POST /auth/verify-email`.
4. **Fallback**: If the app is not installed, the browser opens the API link, which redirects to the web landing page.

### Testing Deep Links

You can test deep links using the Expo CLI:

```bash
# Test custom scheme
npx uri-scheme open "mobile://auth/verify-email?token=test-token" --android

# Test universal link (simulated)
npx uri-scheme open "https://mastersheet.com/email-verified?status=success" --android
```
