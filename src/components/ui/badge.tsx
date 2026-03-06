import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive/10 text-destructive',
        outline: 'text-foreground',
        processing:
          'border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400',
        needs_review:
          'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400',
        approved:
          'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        failed:
          'border-transparent bg-red-500/15 text-red-600 dark:text-red-400',
        uploaded:
          'border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-400',
        extracted:
          'border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
