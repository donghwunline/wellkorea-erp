/**
 * Project KPI Strip.
 *
 * Pure display component for project key performance indicators.
 * Receives data via props - no data fetching.
 *
 * Displays 4 key metrics:
 * - 진행률 (Progress %)
 * - 결재대기 (Pending Approvals)
 * - 문서누락 (Missing Documents)
 * - 미수금 (Accounts Receivable)
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives all data via props
 */

import type { ProjectKPI } from '../model/project';
import { Icon, StatCard } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/formatting';
import { cn } from '@/shared/lib/cn';

export interface ProjectKPIStripProps {
  /** KPI data to display */
  kpis: ProjectKPI;
  /** Additional className */
  className?: string;
}

/**
 * KPI strip component showing project metrics.
 *
 * This is a pure display component that:
 * - Renders KPI data in a horizontal strip format
 * - Receives all data via props
 *
 * @example
 * ```tsx
 * function ProjectViewPage() {
 *   const { data: kpis, isLoading } = useQuery(projectQueries.kpis(projectId));
 *
 *   if (isLoading) return <ProjectKPIStripSkeleton />;
 *   if (!kpis) return null;
 *
 *   return <ProjectKPIStrip kpis={kpis} />;
 * }
 * ```
 */
export function ProjectKPIStrip({
  kpis,
  className,
}: Readonly<ProjectKPIStripProps>) {
  return (
    <div className={cn('mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      <StatCard
        label="진행률"
        value={`${kpis.progressPercent}%`}
        icon={<Icon name="chart-bar" className="h-5 w-5" />}
        trend={
          kpis.progressPercent >= 80
            ? { value: 'On Track', direction: 'up' }
            : kpis.progressPercent >= 50
              ? { value: 'In Progress', direction: 'neutral' }
              : { value: 'Behind', direction: 'down' }
        }
      />

      <StatCard
        label="결재대기"
        value={kpis.pendingApprovals}
        icon={<Icon name="clock" className="h-5 w-5" />}
        trend={
          kpis.pendingApprovals > 0
            ? { value: `${kpis.pendingApprovals} pending`, direction: 'neutral' }
            : undefined
        }
      />

      <StatCard
        label="문서누락"
        value={kpis.missingDocuments}
        icon={<Icon name="document" className="h-5 w-5" />}
        trend={
          kpis.missingDocuments > 0
            ? { value: 'Needs attention', direction: 'down' }
            : { value: 'Complete', direction: 'up' }
        }
      />

      <StatCard
        label="미수금"
        value={formatCurrency(kpis.accountsReceivable)}
        icon={<Icon name="banknotes" className="h-5 w-5" />}
        trend={
          kpis.accountsReceivable > 0
            ? { value: 'Outstanding', direction: 'neutral' }
            : undefined
        }
      />
    </div>
  );
}

/**
 * Loading skeleton for ProjectKPIStrip.
 */
export function ProjectKPIStripSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-xl border border-steel-800/50 bg-steel-900/60"
        />
      ))}
    </div>
  );
}
