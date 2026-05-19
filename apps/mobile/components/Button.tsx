import { Pressable, Text, PressableProps } from 'react-native';

interface ButtonProps extends PressableProps {
  variant?: 'gold' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = 'gold',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'flex-row items-center justify-center rounded-card border transition-all active:opacity-70';

  const sizes = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3',
  };

  const textSizes = {
    sm: 'text-[11px]',
    md: 'text-[12px]',
    lg: 'text-[13px]',
  };

  const variants = {
    gold: 'bg-gold border-gold',
    outline: 'bg-transparent border-gold',
    ghost: 'bg-bg-card border-border',
    danger: 'bg-transparent border-danger',
  };

  const textVariants = {
    gold: 'text-[#121212]',
    outline: 'text-gold',
    ghost: 'text-text-muted',
    danger: 'text-danger',
  };

  return (
    <Pressable
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text
          className={`${textSizes[size]} ${textVariants[variant]} font-body font-bold uppercase tracking-widest`}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
