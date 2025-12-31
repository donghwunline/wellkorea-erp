/**
 * Project KPI Strip
 *
 * Smart component that fetches and displays key performance indicators
 * for a project in a horizontal strip at the top of the project hub page.
 *
 * Displays 4 key metrics:
 * - 진행률 (Progress %)
 * - 결재대기 (Pending Approvals)
 * - 문서누락 (Missing Documents)
 * - 미수금 (Accounts Receivable)
 *
 * State Management (Tier 3 - Server State):
 * - Owned by this component
 * - Uses projectSummaryService.getProjectKPIs()
 */

import { useCallback, useEffect, useState } from 'react';
import { projectSummaryApi, type ProjectKPI } from '@/entities/project';
import { Icon, StatCard } from '@/shared/ui';
import { formatCurrency } from '@/shared/formatting';
import { cn } from '@/shared/ui';

export interface ProjectKPIStripProps {
  /** Project ID to fetch KPIs for */
  projectId: number;
  /** Increment to trigger refetch */
  refreshTrigger?: number;
  /** Additional className */
  className?: string;
}

/**
 * KPI strip component showing project metrics.
 */
export function ProjectKPIStrip({
  projectId,
  refreshTrigger = 0,
  className,
}: Readonly<ProjectKPIStripProps>) {
  const [kpis, setKpis] = useState<ProjectKPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectSummaryApi.getKPIs(projectId);
      setKpis(data);
    } catch {
      setError('Failed to load KPIs');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Fetch on mount and when refreshTrigger changes
  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs, refreshTrigger]);

  // Loading skeleton
  if (isLoading) {
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

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'mb-6 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3',
          className
        )}
      >
        <div className="flex items-center gap-2 text-sm text-red-400">
          <Icon name="warning" className="h-4 w-4" />
          <span>{error}</span>
        </div>
        <button
          onClick={() => void fetchKPIs()}
          className="text-sm text-red-400 hover:text-red-300 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!kpis) return null;

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

export default ProjectKPIStrip;
