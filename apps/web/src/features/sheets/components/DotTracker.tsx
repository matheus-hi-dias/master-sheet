import { useState } from 'react';

interface DotTrackerProps {
  initial: number;
  maxDots: number;
  onValue: (value: number) => void;
}

export function DotTracker({ initial, maxDots, onValue }: DotTrackerProps) {
  const [value, setValue] = useState(
    Math.max(0, Math.min(Math.round(initial) || 0, maxDots)),
  );

  const setDot = (index: number) => {
    const next = index + 1 === value ? index : index + 1;
    setValue(next);
    onValue(next);
  };

  return (
    <div className="flex items-center gap-1.5 min-h-[34px]">
      {Array.from({ length: maxDots }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Dot ${index + 1} of ${maxDots}`}
          onClick={() => setDot(index)}
          className={`w-5 h-5 rounded-full border transition-all duration-150 cursor-pointer ${
            index < value
              ? 'bg-gold border-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]'
              : 'bg-bg-panel border-border hover:border-gold'
          }`}
        />
      ))}
      <span className="ml-1 text-[11px] text-text-muted tabular-nums">
        {value}/{maxDots}
      </span>
    </div>
  );
}