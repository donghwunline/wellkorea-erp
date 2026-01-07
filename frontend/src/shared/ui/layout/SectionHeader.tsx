/**
 * SectionHeader - Header for content sections within cards.
 *
 * Provides a flexbox layout with title on the left and optional
 * action elements (children) on the right.
 *
 * @example
 * ```tsx
 * <Card>
 *   <SectionHeader title="Product Details">
 *     <Badge variant="success">Active</Badge>
 *   </SectionHeader>
 *   <div>Content...</div>
 * </Card>
 * ```
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Title text displayed on the left.
   */
  title: string;

  /**
   * Optional action elements displayed on the right (badges, buttons, etc.).
   */
  children?: ReactNode;
}

export function SectionHeader({
  title,
  children,
  className,
  ...props
}: Readonly<SectionHeaderProps>) {
  return (
    <div
      className={cn('flex items-center justify-between gap-4', className)}
      {...props}
    >
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
