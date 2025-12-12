/**
 * Dashboard Page - Main landing page after login
 *
 * Shows overview of modules with role-based visibility
 */

import { useAuth } from '@/hooks';
import type { RoleName } from '@/services';

interface ModuleCard {
  title: string;
  phase: string;
  description: string;
  icon: string;
  path: string;
  /** Roles that can see this module (if undefined, all can see) */
  roles?: RoleName[];
  /** Roles that should NOT see this module */
  hideFromRoles?: RoleName[];
}

const MODULES: ModuleCard[] = [
  {
    title: 'Projects',
    phase: 'Phase 4',
    description: 'Job lifecycle management',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    path: '/projects',
  },
  {
    title: 'Quotations',
    phase: 'Phase 5',
    description: 'Quote creation & approval',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    path: '/quotations',
    hideFromRoles: ['ROLE_PRODUCTION'], // Production cannot see quotations
  },
  {
    title: 'Products',
    phase: 'Phase 6',
    description: 'Product catalog & pricing',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    path: '/products',
    hideFromRoles: ['ROLE_PRODUCTION'], // Production cannot see pricing
  },
  {
    title: 'Production',
    phase: 'Phase 7',
    description: 'Work progress tracking',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    path: '/production',
  },
  {
    title: 'Delivery',
    phase: 'Phase 8',
    description: 'Shipment management',
    icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
    path: '/delivery',
  },
  {
    title: 'Invoices',
    phase: 'Phase 9',
    description: 'Billing & AR management',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    path: '/invoices',
    roles: ['ROLE_ADMIN', 'ROLE_FINANCE'], // Only Admin and Finance
  },
  {
    title: 'AR/AP Reports',
    phase: 'Phase 10',
    description: 'Accounts receivable/payable',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
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
        {[
          { label: 'Active Projects', value: '-', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2' },
          { label: 'Pending Quotes', value: '-', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'In Production', value: '-', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0' },
          { label: 'Pending Delivery', value: '-', icon: 'M8 7v8a2 2 0 002 2h6' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-steel-800/50 bg-steel-900/60 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-steel-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-steel-800/50 text-copper-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d={stat.icon}
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Modules</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleModules.map(module => (
            <a
              key={module.title}
              href={module.path}
              className="group rounded-xl border border-steel-800/50 bg-steel-900/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-copper-500/30 hover:bg-steel-900/80"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-steel-800/50 text-copper-500 transition-colors group-hover:bg-copper-500/10">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d={module.icon}
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">{module.title}</h3>
              <p className="mt-1 text-sm text-steel-400">{module.description}</p>
              <span className="mt-4 inline-block rounded-full bg-steel-800/50 px-3 py-1 font-mono text-xs text-steel-500">
                {module.phase}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
