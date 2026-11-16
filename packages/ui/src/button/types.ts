import type { ComponentType, ReactNode } from 'react';

export type ButtonVariant = 'gold' | 'outline' | 'ghost' | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  /** Native press handler. Web maps this to `onClick` when `onClick` is absent. */
  onPress?: () => void;
  /** Web click handler. Native maps this to `onPress` when `onPress` is absent. */
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  /** Accessible name for icon-only buttons. */
  accessibilityLabel?: string;
  testID?: string;
}

export declare const Button: ComponentType<ButtonProps>;
