/**
 * EmptyState component for displaying empty data states
 *
 * Variants:
 * - default: Centered empty state with icon, message, and optional action
 * - table: Table-specific empty state with colspan support
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/utils';

export type EmptyStateVariant = 'default' | 'table';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  variant?: EmptyStateVariant;
  message?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  colspan?: number; // Only used for table variant
}

export function EmptyState({
                             variant = 'default',
                             message = 'No data found',
                             description,
                             icon,
                             action,
                             colspan,
                             className,
                             ...props
                           }: Readonly<EmptyStateProps>) {
  const content = (
    <>
      {icon && <div className="mb-4 text-steel-600">{icon}</div>}
      <p className="text-steel-400">{message}</p>
      {description && <p className="mt-1 text-sm text-steel-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </>
  );

  // Table variant
  if (variant === 'table') {
    return (
      <tr>
        <td colSpan={colspan} className={cn('px-6 py-12 text-center', className)} {...props}>
          {content}
        </td>
      </tr>
    );
  }

  // Default centered variant
  return (
    <div className={cn('flex min-h-[200px] items-center justify-center', className)} {...props}>
      <div className="text-center">{content}</div>
    </div>
  );
}

EmptyState.displayName = 'EmptyState';

export default EmptyState;
