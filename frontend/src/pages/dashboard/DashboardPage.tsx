/**
 * Dashboard Page - Main landing page after login
 *
 * Shows overview of modules with role-based visibility
 */

import { useTranslation } from 'react-i18next';
import { Card, Icon, type IconName, StatCard } from '@/shared/ui';
import { useAuth } from '@/entities/auth';
import type { RoleName } from '@/entities/user';

interface ModuleCard {
  titleKey: string;
  descriptionKey: string;
  phase: string;
  icon: IconName;
  path: string;
  /** Roles that can see this module (if undefined, all can see) */
  roles?: RoleName[];
  /** Roles that should NOT see this module */
  hideFromRoles?: RoleName[];
}

const QUICK_STATS_KEYS = [
  { labelKey: 'activeProjects', icon: 'clipboard' as IconName },
  { labelKey: 'pendingQuotes', icon: 'document' as IconName },
  { labelKey: 'inProduction', icon: 'cog' as IconName },
  { labelKey: 'pendingDelivery', icon: 'truck' as IconName },
];

const MODULES: ModuleCard[] = [
  {
    titleKey: 'projects',
    descriptionKey: 'projects',
    phase: 'Phase 4',
    icon: 'clipboard',
    path: '/projects',
  },
  {
    titleKey: 'quotations',
    descriptionKey: 'quotations',
    phase: 'Phase 5',
    icon: 'document',
    path: '/quotations',
    hideFromRoles: ['ROLE_PRODUCTION'], // Production cannot see quotations
  },
  {
    titleKey: 'items',
    descriptionKey: 'items',
    phase: 'Phase 6',
    icon: 'box',
    path: '/products',
    hideFromRoles: ['ROLE_PRODUCTION'], // Production cannot see pricing
  },
  {
    titleKey: 'delivery',
    descriptionKey: 'delivery',
    phase: 'Phase 8',
    icon: 'truck',
    path: '/delivery',
  },
  {
    titleKey: 'invoices',
    descriptionKey: 'invoices',
    phase: 'Phase 9',
    icon: 'cash',
    path: '/invoices',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance
  },
  {
    titleKey: 'reports',
    descriptionKey: 'reports',
    phase: 'Phase 10',
    icon: 'chart-bar',
    path: '/reports',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance
  },
];

export function DashboardPage() {
  const { t } = useTranslation('pages');
  const { user, hasAnyRole } = useAuth();

  // Filter modules based on user roles
  const visibleModules = MODULES.filter(module => {
    if (module.roles && !hasAnyRole(module.roles)) {
      return false;
    }
    if (module.hideFromRoles && hasAnyRole(module.hideFromRoles)) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('dashboard.title')}</h1>
        <p className="mt-1 text-steel-400">{t('dashboard.welcome', { name: user?.fullName || user?.username })}</p>
      </div>

      {/* Quick Stats Row (placeholder for future stats) */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        {QUICK_STATS_KEYS.map(stat => (
          <StatCard
            key={stat.labelKey}
            label={t(`dashboard.quickStats.${stat.labelKey}`)}
            value="-"
            icon={<Icon name={stat.icon} className="h-5 w-5" />}
          />
        ))}
      </div>

      {/* Module Cards */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-white">{t('dashboard.modules')}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleModules.map(module => (
            <Card
              key={module.titleKey}
              variant="interactive"
              className="group transition-all duration-300 hover:border-copper-500/30"
              onClick={() => (globalThis.location.href = module.path)}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-steel-800/50 text-copper-500 transition-colors group-hover:bg-copper-500/10">
                <Icon name={module.icon} className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">{t(`dashboard.moduleNames.${module.titleKey}`)}</h3>
              <p className="mt-1 text-sm text-steel-400">{t(`dashboard.moduleDescriptions.${module.descriptionKey}`)}</p>
              <span className="mt-4 inline-block rounded-full bg-steel-800/50 px-3 py-1 font-mono text-xs text-steel-500">
                {module.phase}
              </span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
