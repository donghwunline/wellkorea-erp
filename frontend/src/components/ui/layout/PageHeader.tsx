/**
 * PageHeader component for consistent page title and action layouts
 *
 * Provides a standardized header for pages with title, description, and actions.
 * Uses compound component pattern for flexible composition.
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/utils';

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PageHeader({ children, className, ...props }: Readonly<PageHeaderProps>) {
  return (
    <div className={cn('mb-6 flex items-center justify-between gap-4', className)} {...props}>
      {children}
    </div>
  );
}

PageHeader.displayName = 'PageHeader';

// PageHeader.Title - Main title section
export interface PageHeaderTitleProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function PageHeaderTitle({ title, description, className, ...props }: Readonly<PageHeaderTitleProps>) {
  return (
    <div className={cn('flex-1', className)} {...props}>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {description && <p className="mt-1 text-sm text-steel-400">{description}</p>}
    </div>
  );
}

PageHeaderTitle.displayName = 'PageHeaderTitle';

// PageHeader.Actions - Action buttons section
export interface PageHeaderActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PageHeaderActions({ children, className, ...props }: Readonly<PageHeaderActionsProps>) {
  return (
    <div className={cn('flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  );
}

PageHeaderActions.displayName = 'PageHeaderActions';

// Compound component pattern
PageHeader.Title = PageHeaderTitle;
PageHeader.Actions = PageHeaderActions;

export default PageHeader;
