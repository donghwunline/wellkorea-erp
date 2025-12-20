/**
 * Project Summary Card
 *
 * Displays summary statistics for a project section with click navigation.
 * Smart component - handles navigation to project sub-pages.
 */

import { useNavigate } from 'react-router-dom';
import { Card, Icon } from '@/components/ui';
import type { IconName } from '@/components/ui/primitives/Icon';
import type { ProjectSection, ProjectSectionSummary } from '@/services';
import { cn } from '@/shared/utils';

export interface ProjectSummaryCardProps {
  /** Project ID for navigation */
  projectId: number;
  /** Section summary data */
  summary: ProjectSectionSummary;
  /** Optional callback when card is clicked (overrides default navigation) */
  onSectionClick?: (section: ProjectSection) => void;
}

/**
 * Icon mapping for each section.
 */
const SECTION_ICONS: Record<ProjectSection, IconName> = {
  quotation: 'document',
  process: 'cog',
  outsource: 'handshake',
  delivery: 'truck',
  documents: 'folder',
  finance: 'banknotes',
};

/**
 * Format currency in KRW.
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format relative time (e.g., "2h ago", "3d ago").
 */
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('ko-KR');
}

/**
 * Card displaying section summary with click navigation.
 */
export function ProjectSummaryCard({
  projectId,
  summary,
  onSectionClick,
}: Readonly<ProjectSummaryCardProps>) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSectionClick) {
      onSectionClick(summary.section);
    } else {
      navigate(`/projects/${projectId}/${summary.section}`);
    }
  };

  const iconName = SECTION_ICONS[summary.section];

  return (
    <Card
      variant="interactive"
      onClick={handleClick}
      className="group relative overflow-hidden transition-all duration-200 hover:border-copper-500/30 hover:shadow-lg hover:shadow-copper-500/5"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-copper-500/10 p-2.5 transition-colors group-hover:bg-copper-500/20">
            <Icon name={iconName} className="h-5 w-5 text-copper-400" />
          </div>
          <h3 className="text-base font-semibold text-white">{summary.label}</h3>
        </div>
        <Icon
          name="arrow-right"
          className="h-4 w-4 text-steel-500 transition-transform group-hover:translate-x-1 group-hover:text-copper-400"
        />
      </div>

      {/* Stats */}
      <div className="space-y-3">
        {/* Total Count */}
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-steel-500">Total</span>
          <span className="text-2xl font-bold text-white">{summary.totalCount}</span>
        </div>

        {/* Progress (for process section) */}
        {summary.progressPercent !== undefined && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-steel-500">Progress</span>
              <span
                className={cn(
                  'font-medium',
                  summary.progressPercent >= 80
                    ? 'text-green-400'
                    : summary.progressPercent >= 50
                      ? 'text-yellow-400'
                      : 'text-steel-300'
                )}
              >
                {summary.progressPercent}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-steel-700">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  summary.progressPercent >= 80
                    ? 'bg-green-500'
                    : summary.progressPercent >= 50
                      ? 'bg-yellow-500'
                      : 'bg-copper-500'
                )}
                style={{ width: `${Math.min(100, summary.progressPercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* Pending Count */}
        {summary.pendingCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-steel-500">Pending</span>
            <span className="text-lg font-semibold text-yellow-400">{summary.pendingCount}</span>
          </div>
        )}

        {/* Value (for quotation/finance sections) */}
        {summary.value !== undefined && (
          <div className="border-t border-steel-700/50 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-steel-500">Value</span>
              <span className="text-base font-semibold text-green-400">
                {formatCurrency(summary.value)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Last Updated */}
      <div className="mt-4 flex items-center gap-1.5 text-xs text-steel-600">
        <Icon name="clock" className="h-3 w-3" />
        <span>Updated {formatRelativeTime(summary.lastUpdated)}</span>
      </div>
    </Card>
  );
}
