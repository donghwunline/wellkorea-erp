/**
 * UserMenu Widget
 *
 * Reusable user menu component with dropdown for user actions.
 * Features:
 * - User avatar with initials
 * - Expandable/collapsed state
 * - Configurable menu items
 * - Built-in logout action
 * - Click-outside and ESC key handling
 *
 * Usage:
 * ```tsx
 * <UserMenu
 *   userName="John Doe"
 *   userInitial="J"
 *   userRole="Admin, Manager"
 *   collapsed={sidebarCollapsed}
 *   menuItems={[
 *     { id: 'profile', label: 'Profile', icon: 'user', onClick: () => navigate('/profile') }
 *   ]}
 * />
 * ```
 */

import type { HTMLAttributes } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { useAuth } from '@/entities/auth';

// ============================================================================
// Types
// ============================================================================

export interface UserMenuItem {
  /** Unique item identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon name from Icon component */
  icon: IconName;
  /** Click handler */
  onClick: () => void;
  /** Item variant (default: 'default') */
  variant?: 'default' | 'danger';
}

export interface UserMenuProps extends HTMLAttributes<HTMLDivElement> {
  /** User display name */
  userName: string;
  /** User initial for avatar (single character) */
  userInitial: string;
  /** User role(s) to display */
  userRole: string;
  /** Is sidebar collapsed? */
  collapsed: boolean;
  /** Additional menu items (logout is always included automatically) */
  menuItems?: UserMenuItem[];
}

// ============================================================================
// Component
// ============================================================================

export function UserMenu({
  userName,
  userInitial,
  userRole,
  collapsed,
  menuItems = [],
  className,
  ...props
}: Readonly<UserMenuProps>) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  const handleItemClick = (item: UserMenuItem) => {
    item.onClick();
    close();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    close();
  };

  return (
    <div className={cn('border-t border-steel-800/50 p-3', className)} {...props}>
      <div ref={containerRef} className="relative">
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-steel-800"
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-copper-500/20 text-copper-400">
            <span className="text-sm font-medium">{userInitial}</span>
          </div>

          {/* User Info (when not collapsed) */}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <p className="truncate text-xs text-steel-500">{userRole}</p>
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop for click-outside */}
            <div className="fixed inset-0 z-40 bg-black/5" aria-hidden="true" />

            {/* Menu */}
            <div
              className={cn(
                'absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-lg',
                'border border-steel-700/50 bg-steel-800 shadow-lg shadow-black/20',
                'animate-in fade-in-0 zoom-in-95 duration-150'
              )}
            >
              <div role="menu" className="py-1">
                {/* Custom Menu Items */}
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
                      item.variant === 'danger'
                        ? 'text-red-400 hover:bg-steel-700'
                        : 'text-steel-300 hover:bg-steel-700 hover:text-white'
                    )}
                  >
                    <Icon name={item.icon} className="h-4 w-4" strokeWidth={2} />
                    {item.label}
                  </button>
                ))}

                {/* Separator if there are custom items */}
                {menuItems.length > 0 && (
                  <div className="my-1 border-t border-steel-700/50" />
                )}

                {/* Logout (always present) */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-steel-700"
                >
                  <Icon name="logout" className="h-4 w-4" strokeWidth={2} />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

UserMenu.displayName = 'UserMenu';

export default UserMenu;
