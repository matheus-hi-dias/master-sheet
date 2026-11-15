import { Pressable, Text } from 'react-native';

import { joinClasses } from '../shared/cn';
import { buttonVariantClasses } from './classes';
import type { ButtonProps, ButtonSize, ButtonVariant } from './types';

const base =
  'flex-row items-center justify-center rounded-card border transition-all active:opacity-70';

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2.5',
  lg: 'px-6 py-3',
};

const textSizes: Record<ButtonSize, string> = {
  sm: 'text-[11px]',
  md: 'text-[12px]',
  lg: 'text-[13px]',
};

const textVariants: Record<ButtonVariant, string> = {
  gold: 'text-on-gold',
  outline: 'text-gold',
  ghost: 'text-text-muted',
  danger: 'text-danger',
};

export function Button({
  variant = 'gold',
  size = 'md',
  className,
  children,
  disabled,
  onPress,
  onClick,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress ?? onClick}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      className={joinClasses(
        base,
        sizes[size],
        buttonVariantClasses[variant],
        className,
      )}
    >
      {typeof children === 'string' ? (
        <Text
          className={joinClasses(
            textSizes[size],
            textVariants[variant],
            'font-body font-bold uppercase tracking-widest',
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
