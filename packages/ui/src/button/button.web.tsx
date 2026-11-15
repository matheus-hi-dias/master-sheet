import { joinClasses } from '../shared/cn';
import { buttonWebVariantClasses } from './classes';
import type { ButtonProps, ButtonSize } from './types';

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-card font-body font-bold uppercase tracking-[0.08em] cursor-pointer border transition-all duration-[var(--motion-duration-base)] leading-none whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';

const sizes: Record<ButtonSize, string> = {
  sm: 'text-[11px] px-3 py-1.5',
  md: 'text-[12px] px-[18px] py-[9px]',
  lg: 'text-[13px] px-6 py-3',
};

export function Button({
  variant = 'gold',
  size = 'md',
  className,
  children,
  disabled,
  onClick,
  onPress,
  type = 'button',
  accessibilityLabel,
  testID,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick ?? onPress}
      aria-label={accessibilityLabel}
      data-testid={testID}
      className={joinClasses(
        base,
        sizes[size],
        buttonWebVariantClasses[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
