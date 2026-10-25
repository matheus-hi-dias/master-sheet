import { type ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-7 pb-5 border-b border-border">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-main tracking-[0.04em]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
