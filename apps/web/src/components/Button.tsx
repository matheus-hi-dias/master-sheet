export function Button({
  variant = 'gold',
  size = 'md',
  className = '',
  children,
  ...props
}: {
  variant?: 'gold' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex items-center gap-1.5 rounded-[var(--radius-card)] font-[var(--font-body)] ' +
    'font-bold uppercase tracking-[0.08em] cursor-pointer border transition-all duration-200 ' +
    'leading-none whitespace-nowrap';

  const sizes = {
    sm: 'text-[11px] px-3 py-1.5',
    md: 'text-[12px] px-[18px] py-[9px]',
    lg: 'text-[13px] px-6 py-3',
  };

  const variants = {
    gold: 'bg-[var(--color-gold)] text-[#121212] border-[var(--color-gold)] hover:brightness-110 hover:shadow-[0_0_16px_rgba(212,175,55,0.35)]',
    outline:
      'bg-transparent text-[var(--color-gold)] border-[var(--color-gold)] hover:bg-[rgba(212,175,55,0.08)]',
    ghost:
      'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-main)] hover:border-[var(--color-text-muted)]',
    danger:
      'bg-transparent text-[var(--color-danger)] border-[var(--color-danger)] hover:bg-[rgba(192,57,43,0.1)]',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
