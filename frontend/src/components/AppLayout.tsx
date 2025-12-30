/**
 * Application Layout with role-based navigation
 *
 * Features:
 * - Sidebar navigation with role-based visibility
 * - User menu with logout
 * - Consistent layout across all pages
 */

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '@/shared/ui';
import { useAuth } from '@/shared/hooks';
import type { RoleName } from '@/shared/types/auth.ts';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  /** Roles that can see this item (if undefined, all authenticated users can see it) */
  roles?: RoleName[];
  /** Roles that should NOT see this item */
  hideFromRoles?: RoleName[];
}

// Operations - Main workflow menus
const OPERATIONS_NAV_ITEMS: NavItem[] = [
  {
    label: '대시보드',
    path: '/',
    icon: 'home',
  },
  {
    label: '프로젝트',
    path: '/projects',
    icon: 'clipboard',
  },
  {
    label: '견적',
    path: '/quotations',
    icon: 'document',
    hideFromRoles: ['ROLE_PRODUCTION'], // Production users cannot see quotations
  },
  {
    label: '공정',
    path: '/production',
    icon: 'cog',
  },
  {
    label: '출고',
    path: '/delivery',
    icon: 'truck',
  },
  {
    label: '정산',
    path: '/invoices',
    icon: 'cash',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance can see invoices
  },
];

// Master Data - Reference/catalog data management
const MASTER_DATA_NAV_ITEMS: NavItem[] = [
  {
    label: '아이템',
    path: '/items',
    icon: 'box',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance can manage items
  },
  {
    label: 'CRM',
    path: '/companies',
    icon: 'building-office',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_SALES'],
  },
  {
    label: '조달',
    path: '/procurement',
    icon: 'shopping-cart',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance can manage procurement
  },
];

// Reports
const REPORTS_NAV_ITEMS: NavItem[] = [
  {
    label: 'AR/AP Reports',
    path: '/reports',
    icon: 'chart-bar',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance can see AR/AP reports
  },
];

const APPROVAL_NAV_ITEMS: NavItem[] = [
  {
    label: '결재 대기 문서',
    path: '/approvals',
    icon: 'check-circle',
  },
  {
    label: '결재 설정',
    path: '/admin/approval-chains',
    icon: 'cog',
    roles: ['ROLE_ADMIN'],
  },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: '사용자 관리',
    path: '/admin/users',
    icon: 'users',
    roles: ['ROLE_ADMIN'],
  },
  {
    label: '이력 확인',
    path: '/admin/audit',
    icon: 'document',
    roles: ['ROLE_ADMIN'],
  },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: Readonly<AppLayoutProps>) {
  const { user, logout, hasAnyRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Filter nav items based on user roles
  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      // If roles are specified, user must have at least one
      if (item.roles && !hasAnyRole(item.roles)) {
        return false;
      }
      // If hideFromRoles are specified, user must NOT have any of them
      if (item.hideFromRoles && hasAnyRole(item.hideFromRoles)) {
        return false;
      }
      return true;
    });
  };

  const visibleOperationsItems = filterNavItems(OPERATIONS_NAV_ITEMS);
  const visibleMasterDataItems = filterNavItems(MASTER_DATA_NAV_ITEMS);
  const visibleReportsItems = filterNavItems(REPORTS_NAV_ITEMS);
  const visibleApprovalItems = filterNavItems(APPROVAL_NAV_ITEMS);
  const visibleAdminItems = filterNavItems(ADMIN_NAV_ITEMS);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-steel-950">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-steel-800/50 bg-steel-900/80 backdrop-blur-xl transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-steel-800/50 px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-8 w-8 rotate-45 border-2 border-copper-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-xs font-semibold text-copper-500">WK</span>
                </div>
              </div>
              <span className="font-semibold text-white">WellKorea</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
          >
            <Icon
              name="chevron-left"
              className={`h-5 w-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {/* Operations Section */}
          <ul className="space-y-1">
            {visibleOperationsItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-copper-500/10 text-copper-400'
                      : 'text-steel-400 hover:bg-steel-800 hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>

          {/* Master Data Section */}
          {visibleMasterDataItems.length > 0 && (
            <>
              <div className="my-4 border-t border-steel-800/50" />
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-steel-500">
                  Master Data
                </p>
              )}
              <ul className="space-y-1">
                {visibleMasterDataItems.map(item => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive(item.path) ||
                        (item.path === '/items' && location.pathname.startsWith('/items'))
                          ? 'bg-copper-500/10 text-copper-400'
                          : 'text-steel-400 hover:bg-steel-800 hover:text-white'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Reports Section */}
          {visibleReportsItems.length > 0 && (
            <>
              <div className="my-4 border-t border-steel-800/50" />
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-steel-500">
                  Reports
                </p>
              )}
              <ul className="space-y-1">
                {visibleReportsItems.map(item => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-copper-500/10 text-copper-400'
                          : 'text-steel-400 hover:bg-steel-800 hover:text-white'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Approval Section */}
          {visibleApprovalItems.length > 0 && (
            <>
              <div className="my-4 border-t border-steel-800/50" />
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-steel-500">
                  Approval
                </p>
              )}
              <ul className="space-y-1">
                {visibleApprovalItems.map(item => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-copper-500/10 text-copper-400'
                          : 'text-steel-400 hover:bg-steel-800 hover:text-white'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Admin Section */}
          {visibleAdminItems.length > 0 && (
            <>
              <div className="my-4 border-t border-steel-800/50" />
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-steel-500">
                  Administration
                </p>
              )}
              <ul className="space-y-1">
                {visibleAdminItems.map(item => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-copper-500/10 text-copper-400'
                          : 'text-steel-400 hover:bg-steel-800 hover:text-white'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="border-t border-steel-800/50 p-3">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-steel-800"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-copper-500/20 text-copper-400">
                <span className="text-sm font-medium">
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?'}
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
                  <p className="truncate text-xs text-steel-500">{user?.roles.join(', ')}</p>
                </div>
              )}
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-lg border border-steel-700/50 bg-steel-800 py-1 shadow-lg">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-steel-700"
                  >
                    <Icon name="logout" className="h-4 w-4" strokeWidth={2} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
