# Mobile Auth

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
