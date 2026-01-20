/**
 * Application Layout with role-based navigation
 *
 * Features:
 * - Sidebar navigation with role-based visibility
 * - User menu with logout
 * - Consistent layout across all pages
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName, Navigation } from '@/shared/ui';
import { useUIStore } from '@/shared/lib/stores/ui-store';
import { useAuth } from '@/entities/auth';
import type { RoleName } from '@/entities/user';
import { UserMenu } from '@/widgets';

interface NavItem {
  labelKey: string;
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
    labelKey: 'navigation:items.dashboard',
    path: '/',
    icon: 'home',
  },
  {
    labelKey: 'navigation:items.projects',
    path: '/projects',
    icon: 'clipboard',
  },
  {
    labelKey: 'navigation:items.quotations',
    path: '/quotations',
    icon: 'document',
    hideFromRoles: ['ROLE_PRODUCTION'], // Production users cannot see quotations
  },
  {
    labelKey: 'navigation:items.deliveries',
    path: '/deliveries',
    icon: 'truck',
  },
  {
    labelKey: 'navigation:items.invoices',
    path: '/invoices',
    icon: 'cash',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance can see invoices
  },
];

// Master Data - Reference/catalog data management
const MASTER_DATA_NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'navigation:items.items',
    path: '/items',
    icon: 'box',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance can manage items
  },
  {
    labelKey: 'navigation:items.companies',
    path: '/companies',
    icon: 'building-office',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_SALES'],
  },
  {
    labelKey: 'navigation:items.procurement',
    path: '/procurement',
    icon: 'shopping-cart',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance can manage procurement
  },
];

// Reports
const REPORTS_NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'navigation:items.arApReports',
    path: '/reports',
    icon: 'chart-bar',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance can see AR/AP reports
  },
];

const APPROVAL_NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'navigation:items.pendingApprovals',
    path: '/approvals',
    icon: 'check-circle',
  },
  {
    labelKey: 'navigation:items.approvalSettings',
    path: '/admin/approval-chains',
    icon: 'cog',
    roles: ['ROLE_ADMIN'],
  },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'navigation:items.userManagement',
    path: '/admin/users',
    icon: 'users',
    roles: ['ROLE_ADMIN'],
  },
  {
    labelKey: 'navigation:items.auditLogs',
    path: '/admin/audit',
    icon: 'document',
    roles: ['ROLE_ADMIN'],
  },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: Readonly<AppLayoutProps>) {
  const { t } = useTranslation('navigation');
  const { user, hasAnyRole } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

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
              <img src="/favicon.svg" alt="WellKorea logo" className="h-8 w-8" />
              <span className="font-semibold text-white">{t('brand.name')}</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
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
        <Navigation collapsed={sidebarCollapsed} aria-label="Main navigation">
          {/* Operations Section */}
          <Navigation.Section title={t('sections.operations')}>
            {visibleOperationsItems.map(item => (
              <Navigation.Link
                key={item.path}
                to={item.path}
                icon={item.icon}
                exact={item.path === '/'}
              >
                {t(item.labelKey)}
              </Navigation.Link>
            ))}
          </Navigation.Section>

          {/* Master Data Section */}
          {visibleMasterDataItems.length > 0 && (
            <Navigation.Section title={t('sections.masterData')} showDivider>
              {visibleMasterDataItems.map(item => (
                <Navigation.Link key={item.path} to={item.path} icon={item.icon}>
                  {t(item.labelKey)}
                </Navigation.Link>
              ))}
            </Navigation.Section>
          )}

          {/* Reports Section */}
          {visibleReportsItems.length > 0 && (
            <Navigation.Section title={t('sections.reports')} showDivider>
              {visibleReportsItems.map(item => (
                <Navigation.Link key={item.path} to={item.path} icon={item.icon}>
                  {t(item.labelKey)}
                </Navigation.Link>
              ))}
            </Navigation.Section>
          )}

          {/* Approval Section */}
          {visibleApprovalItems.length > 0 && (
            <Navigation.Section title={t('sections.approval')} showDivider>
              {visibleApprovalItems.map(item => (
                <Navigation.Link key={item.path} to={item.path} icon={item.icon}>
                  {t(item.labelKey)}
                </Navigation.Link>
              ))}
            </Navigation.Section>
          )}

          {/* Admin Section */}
          {visibleAdminItems.length > 0 && (
            <Navigation.Section title={t('sections.administration')} showDivider>
              {visibleAdminItems.map(item => (
                <Navigation.Link key={item.path} to={item.path} icon={item.icon}>
                  {t(item.labelKey)}
                </Navigation.Link>
              ))}
            </Navigation.Section>
          )}
        </Navigation>

        {/* User Section */}
        <UserMenu
          userName={user?.fullName || user?.username || 'Unknown'}
          userInitial={user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?'}
          userRole={user?.roles.join(', ') || ''}
          collapsed={sidebarCollapsed}
        />
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
