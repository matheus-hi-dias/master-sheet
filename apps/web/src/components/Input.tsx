export function Input({
  label,
  icon,
  className = '',
  ...props
}: {
  label?: string;
  icon?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      {label && (
        <span className="block mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          {label}
        </span>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm pointer-events-none select-none">
            {icon}
          </span>
        )}
        <input
          className={
            'w-full bg-[var(--color-bg-panel)] border border-[var(--color-border)] ' +
            'rounded-[var(--radius-card)] py-[10px] text-[var(--color-text-main)] ' +
            'font-[var(--font-body)] text-[13px] outline-none transition-all duration-200 ' +
            'placeholder:text-[var(--color-text-muted)] ' +
            'focus:border-[var(--color-gold)] focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)] ' +
            (icon ? 'pl-9 pr-3' : 'px-3') +
            ' ' +
            className
          }
          {...props}
        />
      </div>
    </div>
  );
}
