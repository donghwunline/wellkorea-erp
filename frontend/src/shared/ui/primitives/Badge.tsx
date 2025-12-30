/**
 * Badge component for status indicators and labels
 *
 * Features:
 * - Multiple color variants (steel, copper, green, red, blue, purple, orange)
 * - Two sizes (sm, md)
 * - Optional dot indicator for status badges
 *
 * Usage:
 * ```tsx
 * <Badge variant="success" dot>Active</Badge>
 * <Badge variant="danger" size="md">Critical</Badge>
 * <Badge variant="copper">Admin</Badge>
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

export type BadgeVariant =
  | 'steel'
  | 'copper'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple';

export interface BadgeProps {
  /** Badge color variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: 'sm' | 'md';
  /** Show a status dot indicator */
  dot?: boolean;
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  steel: 'bg-steel-500/20 text-steel-300',
  copper: 'bg-copper-500/20 text-copper-400',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-orange-500/20 text-orange-400',
  danger: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

const dotClasses: Record<BadgeVariant, string> = {
  steel: 'bg-steel-300',
  copper: 'bg-copper-400',
  success: 'bg-green-400',
  warning: 'bg-orange-400',
  danger: 'bg-red-400',
  info: 'bg-blue-400',
  purple: 'bg-purple-400',
};

export function Badge({
  variant = 'steel',
  size = 'sm',
  dot = false,
  children,
  className,
}: Readonly<BadgeProps>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[variant])} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

export default Badge;
