/**
 * Tabs Component (Compound Component Pattern)
 *
 * Manages tab state with optional URL hash routing.
 * Supports role-based tab visibility and badge counts.
 *
 * Usage:
 * ```tsx
 * <Tabs defaultTab="overview" hash={true}>
 *   <TabList>
 *     <Tab id="overview">개요</Tab>
 *     <Tab id="quotation" badge={2} badgeVariant="warning">견적/결재</Tab>
 *   </TabList>
 *   <TabPanel id="overview">Overview content</TabPanel>
 *   <TabPanel id="quotation">Quotation content</TabPanel>
 * </Tabs>
 * ```
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Badge, type BadgeVariant } from '@/components/ui/primitives/Badge';
import { Icon, type IconName } from '@/components/ui/primitives/Icon';
import { cn } from '@/shared/utils';

// ============================================================================
// Types
// ============================================================================

export interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  registerTab: (tabId: string) => void;
  unregisterTab: (tabId: string) => void;
  tabIds: string[];
}

export interface TabsProps {
  /** Default active tab ID */
  defaultTab: string;
  /** Enable URL hash routing (#tab-id) */
  hash?: boolean;
  /** Controlled active tab (overrides internal state) */
  activeTab?: string;
  /** Tab changed callback */
  onTabChange?: (tabId: string) => void;
  children: ReactNode;
  className?: string;
}

export interface TabListProps {
  children: ReactNode;
  className?: string;
}

export interface TabProps {
  /** Unique tab identifier */
  id: string;
  /** Optional icon */
  icon?: IconName;
  /** Badge count (optional) */
  badge?: number;
  /** Badge variant */
  badgeVariant?: BadgeVariant;
  /** Tab is disabled */
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export interface TabPanelProps {
  /** Tab ID this panel belongs to */
  id: string;
  /** Keep panel mounted when inactive (default: false) */
  keepMounted?: boolean;
  children: ReactNode;
  className?: string;
}

// ============================================================================
// Context
// ============================================================================

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within <Tabs>');
  }
  return context;
}

// ============================================================================
// Tabs (Root)
// ============================================================================

export function Tabs({
  defaultTab,
  hash = false,
  activeTab: controlledActiveTab,
  onTabChange,
  children,
  className,
}: Readonly<TabsProps>) {
  // Internal tab state
  const [internalActiveTab, setInternalActiveTab] = useState(() => {
    // Initialize from hash if hash mode is enabled
    if (hash && typeof window !== 'undefined') {
      const hashValue = window.location.hash.slice(1);
      return hashValue || defaultTab;
    }
    return defaultTab;
  });

  // Track registered tab IDs for keyboard navigation
  const [tabIds, setTabIds] = useState<string[]>([]);

  // Use controlled or internal state
  const activeTab = controlledActiveTab ?? internalActiveTab;

  // Register/unregister tabs for keyboard navigation
  const registerTab = useCallback((tabId: string) => {
    setTabIds(prev => (prev.includes(tabId) ? prev : [...prev, tabId]));
  }, []);

  const unregisterTab = useCallback((tabId: string) => {
    setTabIds(prev => prev.filter(id => id !== tabId));
  }, []);

  // Set active tab handler
  const setActiveTab = useCallback(
    (tabId: string) => {
      setInternalActiveTab(tabId);
      onTabChange?.(tabId);

      // Update hash if hash mode enabled
      if (hash && typeof window !== 'undefined') {
        window.location.hash = tabId === defaultTab ? '' : tabId;
      }
    },
    [hash, defaultTab, onTabChange]
  );

  // Sync with hash changes (browser back/forward)
  useEffect(() => {
    if (!hash || typeof window === 'undefined') return;

    const handleHashChange = () => {
      const hashValue = window.location.hash.slice(1);
      const newTab = hashValue || defaultTab;
      setInternalActiveTab(newTab);
      onTabChange?.(newTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [hash, defaultTab, onTabChange]);

  // Context value
  const contextValue = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      registerTab,
      unregisterTab,
      tabIds,
    }),
    [activeTab, setActiveTab, registerTab, unregisterTab, tabIds]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('space-y-6', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// ============================================================================
// TabList
// ============================================================================

export function TabList({ children, className }: Readonly<TabListProps>) {
  const { activeTab, setActiveTab, tabIds } = useTabs();

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabIds.indexOf(activeTab);
    if (currentIndex === -1) return;

    let newIndex: number | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabIds.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentIndex < tabIds.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabIds.length - 1;
        break;
    }

    if (newIndex !== null && tabIds[newIndex]) {
      setActiveTab(tabIds[newIndex]);
    }
  };

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center gap-1 border-b border-steel-700/50',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Tab
// ============================================================================

export function Tab({
  id,
  icon,
  badge,
  badgeVariant = 'warning',
  disabled = false,
  children,
  className,
}: Readonly<TabProps>) {
  const { activeTab, setActiveTab, registerTab, unregisterTab } = useTabs();
  const isActive = activeTab === id;

  // Register this tab on mount
  useEffect(() => {
    registerTab(id);
    return () => unregisterTab(id);
  }, [id, registerTab, unregisterTab]);

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(id);
    }
  };

  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      aria-disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'group relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-500/50',
        isActive
          ? 'text-white'
          : 'text-steel-400 hover:text-steel-200',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {icon && <Icon name={icon} className="h-4 w-4" />}
      <span>{children}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant={badgeVariant} size="sm">
          {badge}
        </Badge>
      )}
      {/* Active indicator */}
      {isActive && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 bg-copper-500" />
      )}
    </button>
  );
}

// ============================================================================
// TabPanel
// ============================================================================

export function TabPanel({
  id,
  keepMounted = false,
  children,
  className,
}: Readonly<TabPanelProps>) {
  const { activeTab } = useTabs();
  const isActive = activeTab === id;

  // Don't render if not active and not keepMounted
  if (!isActive && !keepMounted) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      className={cn(!isActive && 'hidden', className)}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default Tabs;
