import { joinClasses } from '../shared/cn';
import type { TagProps } from './types';

const filterBase =
  'inline-flex items-center text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full border transition-all duration-[var(--motion-duration-base)] cursor-pointer';

const filterActive = 'bg-gold text-on-gold border-gold shadow-tag-glow';

const filterInactive =
  'bg-transparent text-text-muted border-border hover:border-gold hover:text-gold hover:bg-gold-tint';

const displayBase =
  'inline-flex items-center bg-bg-panel text-gold border border-border rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider';

export function Tag({
  active = false,
  variant = 'filter',
  className,
  children,
  disabled,
  onClick,
  onPress,
  accessibilityLabel,
  testID,
}: TagProps) {
  const isDisplay = variant === 'display';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick ?? onPress}
      aria-pressed={isDisplay ? undefined : active}
      aria-label={accessibilityLabel}
      data-testid={testID}
      className={joinClasses(
        isDisplay
          ? displayBase
          : joinClasses(filterBase, active ? filterActive : filterInactive),
        className,
      )}
    >
      {children}
    </button>
  );
}
