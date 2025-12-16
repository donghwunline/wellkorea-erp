/**
 * Card component with semantic variants
 *
 * Variants:
 * - default: Standard content card
 * - table: For wrapping tables with proper borders
 * - interactive: Adds hover effects for clickable cards
 * - stat: Optimized for dashboard stat displays
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '../utils/cn';

export type CardVariant = 'default' | 'table' | 'interactive' | 'stat';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  default: 'rounded-xl border border-steel-800/50 bg-steel-900/60 p-6 backdrop-blur-sm',
  table: 'rounded-xl border border-steel-800/50 bg-steel-900/60 backdrop-blur-sm overflow-hidden',
  interactive:
    'rounded-xl border border-steel-800/50 bg-steel-900/60 p-6 backdrop-blur-sm transition-colors hover:bg-steel-800/50 cursor-pointer',
  stat: 'rounded-xl border border-steel-800/50 bg-steel-900/60 p-4 backdrop-blur-sm',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(VARIANT_STYLES[variant], className)} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export default Card;
