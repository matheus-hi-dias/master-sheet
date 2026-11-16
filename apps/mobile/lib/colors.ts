import { colorTokens } from '@master-sheet/design-tokens/tokens';

/**
 * App-local palette for values that must be passed as JavaScript props (icon
 * `color`, `placeholderTextColor`, navigator options, shadows) instead of
 * NativeWind classes.
 *
 * The mobile app is dark-first today, so this pins the dark theme tokens.
 * When light-theme support lands, resolve the palette through the active theme
 * instead of importing `colorTokens.dark` directly.
 */
export const colors = colorTokens.dark;
