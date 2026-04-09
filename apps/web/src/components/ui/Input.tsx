import React, { forwardRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon, error, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <span className="block mb-1.5 text-[11px] font-bold uppercase tracking-widest text-text-muted">
            {label}
          </span>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none select-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            type={computedType}
            className={cn(
              'w-full bg-bg-panel border border-border',
              'rounded-card py-[10px] text-text-main',
              'font-body text-[13px] outline-none transition-all duration-200',
              'placeholder:text-text-muted',
              'focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]',
              icon ? 'pl-9' : 'px-3',
              isPassword || error ? 'pr-14' : 'pr-3',
              error &&
                'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(192,57,43,0.12)]',
              className,
            )}
            {...props}
          />
          {(error || isPassword) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-bg-panel">
              {isPassword && (
                <button
                  type="button"
                  tabIndex={-1}
                  className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}
              {error && (
                <span className="text-danger">
                  <AlertCircle size={15} />
                </span>
              )}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
