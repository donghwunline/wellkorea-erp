/**
 * Project Production Summary Card.
 *
 * Displays aggregated production progress for a project.
 * Shows overall progress and breakdown by status.
 */

import { Card } from '@/shared/ui';
import type { ProjectProductionSummary } from '../model/work-progress-sheet';

export interface ProjectProductionSummaryCardProps {
  /**
   * Project production summary data.
   */
  summary: ProjectProductionSummary;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Card component showing project production statistics.
 *
 * @example
 * ```tsx
 * function ProjectPage() {
 *   const { data: summary } = useQuery(workProgressQueries.projectSummary(projectId));
 *
 *   return summary ? (
 *     <ProjectProductionSummaryCard summary={summary} />
 *   ) : null;
 * }
 * ```
 */
export function ProjectProductionSummaryCard({
  summary,
  className,
}: Readonly<ProjectProductionSummaryCardProps>) {
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage > 50) return 'bg-blue-500';
    if (percentage > 0) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <Card className={className}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">생산 현황</h3>
          {summary.jobCode && (
            <span className="text-sm text-steel-400 font-mono">{summary.jobCode}</span>
          )}
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-steel-400">전체 진행률</span>
            <span className="text-2xl font-bold text-white">
              {summary.overallProgressPercentage}%
            </span>
          </div>
          <div className="h-3 bg-steel-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor(summary.overallProgressPercentage)} transition-all duration-300`}
              style={{ width: `${summary.overallProgressPercentage}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-steel-500">
            {summary.completedSteps} / {summary.totalSteps} 공정 완료
          </div>
        </div>

        {/* Sheet Status Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-steel-800/50 rounded-lg">
            <div className="text-2xl font-bold text-steel-300">
              {summary.notStartedSheets}
            </div>
            <div className="text-xs text-steel-500">미시작</div>
          </div>
          <div className="text-center p-3 bg-blue-900/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {summary.inProgressSheets}
            </div>
            <div className="text-xs text-steel-500">진행중</div>
          </div>
          <div className="text-center p-3 bg-green-900/30 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {summary.completedSheets}
            </div>
            <div className="text-xs text-steel-500">완료</div>
          </div>
        </div>

        {/* Total sheets info */}
        <div className="mt-4 text-center text-sm text-steel-400">
          총 {summary.totalSheets}개 작업지
        </div>
      </div>
    </Card>
  );
}
