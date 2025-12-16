/**
 * Dashboard Page - Main landing page after login
 *
 * Shows overview of modules with role-based visibility
 */

import { Card, Icon, type IconName, StatCard } from '@/components/ui';
import { useAuth } from '@/hooks';
import type { RoleName } from '@/services';

interface ModuleCard {
  title: string;
  phase: string;
  description: string;
  icon: IconName;
  path: string;
  /** Roles that can see this module (if undefined, all can see) */
  roles?: RoleName[];
  /** Roles that should NOT see this module */
  hideFromRoles?: RoleName[];
}

const QUICK_STATS = [
  {
    label: 'Active Projects',
    value: '-',
    icon: 'clipboard' as IconName,
  },
  {
    label: 'Pending Quotes',
    value: '-',
    icon: 'document' as IconName,
  },
  { label: 'In Production', value: '-', icon: 'cog' as IconName },
  { label: 'Pending Delivery', value: '-', icon: 'truck' as IconName },
];

const MODULES: ModuleCard[] = [
  {
    title: 'Projects',
    phase: 'Phase 4',
    description: 'Job lifecycle management',
    icon: 'clipboard',
    path: '/projects',
  },
  {
    title: 'Quotations',
    phase: 'Phase 5',
    description: 'Quote creation & approval',
    icon: 'document',
    path: '/quotations',
    hideFromRoles: ['ROLE_PRODUCTION'], // Production cannot see quotations
  },
  {
    title: 'Products',
    phase: 'Phase 6',
    description: 'Product catalog & pricing',
    icon: 'box',
    path: '/products',
    hideFromRoles: ['ROLE_PRODUCTION'], // Production cannot see pricing
  },
  {
    title: 'Production',
    phase: 'Phase 7',
    description: 'Work progress tracking',
    icon: 'cog',
    path: '/production',
  },
  {
    title: 'Delivery',
    phase: 'Phase 8',
    description: 'Shipment management',
    icon: 'truck',
    path: '/delivery',
  },
  {
    title: 'Invoices',
    phase: 'Phase 9',
    description: 'Billing & AR management',
    icon: 'cash',
    path: '/invoices',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance
  },
  {
    title: 'AR/AP Reports',
    phase: 'Phase 10',
    description: 'Accounts receivable/payable',
    icon: 'chart-bar',
    path: '/reports',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance
  },
];

export function DashboardPage() {
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
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-steel-400">
          Welcome back, {user?.fullName || user?.username}
        </p>
      </div>

      {/* Quick Stats Row (placeholder for future stats) */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        {QUICK_STATS.map(stat => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={<Icon name={stat.icon} className="h-5 w-5" />}
          />
        ))}
      </div>

      {/* Module Cards */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Modules</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleModules.map(module => (
            <Card
              key={module.title}
              variant="interactive"
              className="group transition-all duration-300 hover:border-copper-500/30"
              onClick={() => globalThis.location.href = module.path}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-steel-800/50 text-copper-500 transition-colors group-hover:bg-copper-500/10">
                <Icon name={module.icon} className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">{module.title}</h3>
              <p className="mt-1 text-sm text-steel-400">{module.description}</p>
              <span
                className="mt-4 inline-block rounded-full bg-steel-800/50 px-3 py-1 font-mono text-xs text-steel-500">
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
