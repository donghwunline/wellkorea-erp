/**
 * Project KPI Strip.
 *
 * Pure display component for project key performance indicators.
 * Receives data via props - no data fetching.
 *
 * Displays 4 key metrics:
 * - 진행률 (Progress %)
 * - 결재대기 (Pending Approvals)
 * - 미수금 (Accounts Receivable)
 * - 청구금액 (Invoiced Amount)
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives all data via props
 */

import { useTranslation } from 'react-i18next';
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
export function ProjectKPIStrip({ kpis, className }: Readonly<ProjectKPIStripProps>) {
  const { t } = useTranslation('entities');

  return (
    <div className={cn('mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      <StatCard
        label={t('project.kpi.progress')}
        value={`${kpis.progressPercent}%`}
        icon={<Icon name="chart-bar" className="h-5 w-5" />}
        trend={
          kpis.progressPercent >= 80
            ? { value: t('project.kpi.trends.onTrack'), direction: 'up' }
            : kpis.progressPercent >= 50
              ? { value: t('project.kpi.trends.inProgress'), direction: 'neutral' }
              : { value: t('project.kpi.trends.behind'), direction: 'down' }
        }
      />

      <StatCard
        label={t('project.kpi.pendingApprovals')}
        value={kpis.pendingApprovals}
        icon={<Icon name="clock" className="h-5 w-5" />}
        trend={
          kpis.pendingApprovals > 0
            ? {
                value: t('project.kpi.trends.pending', { count: kpis.pendingApprovals }),
                direction: 'neutral',
              }
            : undefined
        }
      />

      <StatCard
        label={t('project.kpi.invoicedAmount')}
        value={formatCurrency(kpis.invoicedAmount)}
        icon={<Icon name="document-duplicate" className="h-5 w-5" />}
        trend={
          kpis.invoicedAmount > 0
            ? { value: t('project.kpi.trends.issued'), direction: 'up' }
            : undefined
        }
      />

      <StatCard
        label={t('project.kpi.accountsReceivable')}
        value={formatCurrency(kpis.accountsReceivable)}
        icon={<Icon name="banknotes" className="h-5 w-5" />}
        trend={
          kpis.accountsReceivable > 0
            ? { value: t('project.kpi.trends.outstanding'), direction: 'neutral' }
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
