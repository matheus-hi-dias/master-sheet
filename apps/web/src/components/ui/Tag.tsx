import React from 'react';
import { cn } from '../../lib/utils';

export interface TagProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Tag({ children, active, className, ...props }: TagProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer',
        active
          ? 'bg-gold text-[#121212] border-gold shadow-[0_0_12px_rgba(212,175,55,0.3)]'
          : 'bg-transparent text-text-muted border-border hover:border-gold hover:text-gold hover:bg-[rgba(212,175,55,0.05)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
