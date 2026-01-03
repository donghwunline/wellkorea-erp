/**
 * LoadingState component for displaying loading states
 *
 * Variants:
 * - spinner: Just the spinner (for inline use)
 * - centered: Centered spinner with optional message (for full-page/section loading)
 * - table: Table-specific loading state with colspan support
 */

import type { HTMLAttributes } from 'react';
import type { SpinnerProps } from '../primitives/Spinner';
import { Spinner } from '../primitives/Spinner';
import { cn } from '@/shared/lib/cn';

export type LoadingStateVariant = 'spinner' | 'centered' | 'table';

export interface LoadingStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  variant?: LoadingStateVariant;
  message?: string;
  spinnerSize?: SpinnerProps['size'];
  colspan?: number; // Only used for table variant
}

export function LoadingState({
  variant = 'centered',
  message = 'Loading...',
  spinnerSize = 'lg',
  colspan,
  className,
  ...props
}: Readonly<LoadingStateProps>) {
  // Spinner-only variant
  if (variant === 'spinner') {
    return <Spinner size={spinnerSize} className={className} />;
  }

  // Table variant
  if (variant === 'table') {
    return (
      <tr>
        <td colSpan={colspan} className={cn('px-6 py-12 text-center', className)} {...props}>
          <Spinner size={spinnerSize} className="mx-auto" />
          {message && <p className="mt-2 text-sm text-steel-400">{message}</p>}
        </td>
      </tr>
    );
  }

  // Centered variant (default)
  return (
    <div className={cn('flex min-h-[200px] items-center justify-center', className)} {...props}>
      <div className="text-center">
        <Spinner size={spinnerSize} className="mx-auto" />
        {message && <p className="mt-4 text-steel-400">{message}</p>}
      </div>
    </div>
  );
}

LoadingState.displayName = 'LoadingState';

export default LoadingState;
