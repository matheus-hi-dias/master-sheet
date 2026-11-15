import { joinClasses } from '../shared/cn';
import { clampDotValue, toggleDotValue } from '../shared/dot';
import type { DotTrackerProps } from './types';

export function DotTracker({
  value,
  maxDots,
  onChange,
  className,
  testID,
}: DotTrackerProps) {
  const current = clampDotValue(value, maxDots);

  return (
    <div
      className={joinClasses(
        'flex items-center gap-1.5 min-h-[34px]',
        className,
      )}
      data-testid={testID}
    >
      {Array.from({ length: maxDots }, (_, index) => {
        const filled = index < current;

        return (
          <button
            key={index}
            type="button"
            aria-label={`Dot ${index + 1} of ${maxDots}`}
            aria-pressed={filled}
            onClick={() => onChange(toggleDotValue(current, index, maxDots))}
            className={joinClasses(
              'w-5 h-5 rounded-full border transition-all duration-[var(--motion-duration-fast)] cursor-pointer',
              filled
                ? 'bg-gold border-gold shadow-dot-glow'
                : 'bg-bg-panel border-border hover:border-gold',
            )}
          />
        );
      })}
      <span className="ml-1 text-[11px] text-text-muted tabular-nums">
        {current}/{maxDots}
      </span>
    </div>
  );
}
