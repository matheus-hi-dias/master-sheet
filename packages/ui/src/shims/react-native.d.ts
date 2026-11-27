/**
 * Minimal React Native type surface used by the native renderers.
 *
 * The package keeps `react-native` as a peer dependency only, so it cannot
 * resolve the real types during its own isolated typecheck. The consuming apps
 * still typecheck these files against the real `react-native` types through the
 * `./button/native`-style subpath exports.
 */
declare module 'react-native' {
  import type { ComponentType, ReactNode } from 'react';

  export interface ViewProps {
    className?: string;
    style?: unknown;
    testID?: string;
    children?: ReactNode;
  }

  export interface TextProps {
    className?: string;
    children?: ReactNode;
  }

  export interface PressableProps {
    className?: string;
    children?: ReactNode;
    disabled?: boolean;
    onPress?: () => void;
    hitSlop?: number;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    accessibilityState?: { selected?: boolean; disabled?: boolean };
    testID?: string;
  }

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const Pressable: ComponentType<PressableProps>;

  export function useColorScheme(): 'light' | 'dark' | null;
}
