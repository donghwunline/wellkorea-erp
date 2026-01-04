/**
 * Navigation compound component for sidebar navigation
 *
 * Provides a flexible, composable navigation system with:
 * - Collapsed/expanded state management via context
 * - Prefix matching for active state detection
 * - Consistent section titles and dividers
 *
 * Usage:
 * ```tsx
 * <Navigation collapsed={sidebarCollapsed}>
 *   <Navigation.Section title="Operations">
 *     <Navigation.Link to="/" icon="home" exact>Dashboard</Navigation.Link>
 *     <Navigation.Link to="/projects" icon="clipboard">Projects</Navigation.Link>
 *   </Navigation.Section>
 *
 *   <Navigation.Section title="Master Data" showDivider>
 *     <Navigation.Link to="/items" icon="box">Items</Navigation.Link>
 *   </Navigation.Section>
 * </Navigation>
 * ```
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { Icon } from '../primitives/Icon';
import type { IconName } from '../primitives/Icon';

// ============================================================================
// Context
// ============================================================================

interface NavigationContextValue {
  collapsed: boolean;
  pathname: string;
  isActive: (path: string, exact?: boolean) => boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('Navigation sub-components must be used within <Navigation>');
  }
  return context;
}

// ============================================================================
// Navigation (Root Component)
// ============================================================================

export interface NavigationProps extends HTMLAttributes<HTMLElement> {
  /** Sidebar collapsed state */
  collapsed: boolean;
  /** Override pathname for testing (defaults to useLocation().pathname) */
  pathname?: string;
  children: ReactNode;
}

export function Navigation({
  collapsed,
  pathname: pathnameProp,
  children,
  className,
  ...props
}: Readonly<NavigationProps>) {
  const location = useLocation();
  const pathname = pathnameProp ?? location.pathname;

  const contextValue = useMemo<NavigationContextValue>(
    () => ({
      collapsed,
      pathname,
      isActive: (path: string, exact = false) => {
        if (exact || path === '/') {
          return pathname === path;
        }
        return pathname === path || pathname.startsWith(`${path}/`);
      },
    }),
    [collapsed, pathname]
  );

  return (
    <NavigationContext.Provider value={contextValue}>
      <nav className={cn('flex-1 overflow-y-auto p-3', className)} {...props}>
        {children}
      </nav>
    </NavigationContext.Provider>
  );
}

Navigation.displayName = 'Navigation';

// ============================================================================
// Navigation.Section
// ============================================================================

export interface NavigationSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Section title (shown when not collapsed) */
  title: string;
  /** Show divider above section (default: false) */
  showDivider?: boolean;
  children: ReactNode;
}

export function NavigationSection({
  title,
  showDivider = false,
  children,
  className,
  ...props
}: Readonly<NavigationSectionProps>) {
  const { collapsed } = useNavigation();

  return (
    <div className={className} {...props}>
      {showDivider && <div className="my-4 border-t border-steel-800/50" />}
      {!collapsed && (
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-steel-500">
          {title}
        </p>
      )}
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

NavigationSection.displayName = 'NavigationSection';

// ============================================================================
// Navigation.Link
// ============================================================================

export interface NavigationLinkProps extends Omit<HTMLAttributes<HTMLAnchorElement>, 'children'> {
  /** Link destination path */
  to: string;
  /** Icon name from Icon component */
  icon: IconName;
  /** Link label */
  children: ReactNode;
  /** Use exact path matching (default: false, uses prefix matching) */
  exact?: boolean;
}

export function NavigationLink({
  to,
  icon,
  children,
  exact = false,
  className,
  ...props
}: Readonly<NavigationLinkProps>) {
  const { collapsed, isActive } = useNavigation();
  const active = isActive(to, exact);

  return (
    <li>
      <Link
        to={to}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          active
            ? 'bg-copper-500/10 text-copper-400'
            : 'text-steel-400 hover:bg-steel-800 hover:text-white',
          className
        )}
        title={collapsed ? String(children) : undefined}
        {...props}
      >
        <Icon name={icon} className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{children}</span>}
      </Link>
    </li>
  );
}

NavigationLink.displayName = 'NavigationLink';

// ============================================================================
// Compound Component Pattern
// ============================================================================

Navigation.Section = NavigationSection;
Navigation.Link = NavigationLink;

export default Navigation;
