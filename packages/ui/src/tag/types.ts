import type { ComponentType, ReactNode } from 'react';

export type TagVariant = 'filter' | 'display';

export interface TagProps {
  active?: boolean;
  /** `filter` is the interactive chip; `display` is the compact, non-interactive metadata pill. */
  variant?: TagVariant;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  onClick?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export declare const Tag: ComponentType<TagProps>;
