/**
 * ModalActions component for modal footer buttons
 *
 * Provides consistent layout and spacing for modal action buttons.
 * Use at the end of Modal children for cancel/submit actions.
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/utils';

export interface ModalActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: 'left' | 'right' | 'between' | 'center';
}

const ALIGN_STYLES = {
  left: 'justify-start',
  right: 'justify-end',
  between: 'justify-between',
  center: 'justify-center',
} as const;

export function ModalActions({
  children,
  align = 'right',
  className,
  ...props
}: Readonly<ModalActionsProps>) {
  return (
    <div
      className={cn(
        'mt-6 flex items-center gap-3 border-t border-steel-800/50 pt-6',
        ALIGN_STYLES[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

ModalActions.displayName = 'ModalActions';

export default ModalActions;
