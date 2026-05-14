import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-[0.5rem] bg-bg-elevated border border-border px-4 py-2',
        'text-sm text-text-primary placeholder:text-text-muted',
        'transition-all duration-200',
        'focus:outline-none focus:border-accent focus:shadow-glow',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
