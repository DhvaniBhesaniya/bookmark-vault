import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-white hover:bg-accent/90 hover:shadow-glow active:scale-[0.98]',
        ghost:
          'bg-transparent border border-white/20 text-text-primary hover:border-accent hover:text-accent hover:shadow-glow',
        outline:
          'border border-border text-text-secondary hover:border-border-hover hover:text-text-primary',
        danger:
          'bg-transparent border border-danger/30 text-danger hover:bg-danger/10 hover:border-danger',
        link: 'text-accent-light underline-offset-4 hover:underline hover:text-accent',
        icon: 'bg-transparent text-text-muted hover:text-text-primary hover:bg-bg-elevated',
      },
      size: {
        default: 'h-10 px-5 py-2 rounded-[0.5rem]',
        sm: 'h-8 px-3 py-1 text-xs rounded-[0.5rem]',
        lg: 'h-12 px-8 py-3 text-base rounded-[0.5rem]',
        icon: 'h-9 w-9 rounded-[0.5rem]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };
