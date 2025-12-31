/**
 * TabOverflow Component
 *
 * Displays overflow tabs in a dropdown menu.
 * Used when there are more tabs than fit in the primary tab bar.
 *
 * Usage:
 * ```tsx
 * <TabList>
 *   <Tab id="overview">개요</Tab>
 *   <Tab id="quotation">견적</Tab>
 *   <TabOverflow>
 *     <TabOverflow.Item id="documents">문서</TabOverflow.Item>
 *     <TabOverflow.Item id="finance" badge={2}>정산</TabOverflow.Item>
 *   </TabOverflow>
 * </TabList>
 * ```
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Badge, type BadgeVariant } from '../primitives/Badge';
import { Icon, type IconName } from '../primitives/Icon';
import { cn } from '../lib';

// ============================================================================
// Types
// ============================================================================

export interface TabOverflowContextValue {
  activeTab: string;
  onTabSelect: (tabId: string) => void;
  closeDropdown: () => void;
}

export interface TabOverflowProps {
  /** Currently active tab (from Tabs context) */
  activeTab: string;
  /** Called when overflow tab selected */
  onTabSelect: (tabId: string) => void;
  /** Label for dropdown trigger */
  label?: string;
  /** Icon for trigger */
  icon?: IconName;
  children: ReactNode;
  className?: string;
}

export interface TabOverflowItemProps {
  /** Unique tab identifier */
  id: string;
  /** Optional icon */
  icon?: IconName;
  /** Badge count */
  badge?: number;
  /** Badge variant */
  badgeVariant?: BadgeVariant;
  /** Disabled state */
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

// ============================================================================
// Context
// ============================================================================

const TabOverflowContext = createContext<TabOverflowContextValue | null>(null);

function useTabOverflow() {
  const context = useContext(TabOverflowContext);
  if (!context) {
    throw new Error('TabOverflow.Item must be used within <TabOverflow>');
  }
  return context;
}

// ============================================================================
// TabOverflow (Root)
// ============================================================================

export function TabOverflow({
  activeTab,
  onTabSelect,
  label = 'More',
  icon = 'chevron-down',
  children,
  className,
}: Readonly<TabOverflowProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close on outside click
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

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDropdown();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDropdown]);

  const contextValue: TabOverflowContextValue = {
    activeTab,
    onTabSelect: (tabId: string) => {
      onTabSelect(tabId);
      closeDropdown();
    },
    closeDropdown,
  };

  return (
    <TabOverflowContext.Provider value={contextValue}>
      <div ref={containerRef} className={cn('relative', className)}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={cn(
            'flex items-center gap-1.5 px-3 py-3 text-sm font-medium',
            'text-steel-400 transition-colors hover:text-steel-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-500/50',
            isOpen && 'text-steel-200'
          )}
        >
          <span>{label}</span>
          <Icon
            name={icon}
            className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <>
            {/* Backdrop (invisible, just for click outside) */}
            <div className="fixed inset-0 z-40" aria-hidden="true" />

            {/* Menu */}
            <div
              className={cn(
                'absolute right-0 z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg',
                'border border-steel-700/50 bg-steel-800 shadow-xl shadow-black/20',
                'animate-in fade-in-0 zoom-in-95 duration-150'
              )}
            >
              <div role="menu" className="py-1">
                {children}
              </div>
            </div>
          </>
        )}
      </div>
    </TabOverflowContext.Provider>
  );
}

// ============================================================================
// TabOverflow.Item
// ============================================================================

function TabOverflowItem({
  id,
  icon,
  badge,
  badgeVariant = 'warning',
  disabled = false,
  children,
  className,
}: Readonly<TabOverflowItemProps>) {
  const { activeTab, onTabSelect } = useTabOverflow();
  const isActive = activeTab === id;

  const handleClick = () => {
    if (!disabled) {
      onTabSelect(id);
    }
  };

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors',
        'text-left',
        isActive
          ? 'bg-copper-500/10 text-copper-400'
          : 'text-steel-300 hover:bg-steel-700/50 hover:text-white',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {icon && <Icon name={icon} className="h-4 w-4" />}
      <span className="flex-1">{children}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant={badgeVariant} size="sm">
          {badge}
        </Badge>
      )}
      {isActive && (
        <Icon name="check" className="h-4 w-4 text-copper-400" />
      )}
    </button>
  );
}

// Attach Item as static property
TabOverflow.Item = TabOverflowItem;

// ============================================================================
// Export
// ============================================================================

export default TabOverflow;
