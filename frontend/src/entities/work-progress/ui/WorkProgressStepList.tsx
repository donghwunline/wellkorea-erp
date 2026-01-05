/**
 * Work Progress Step List.
 *
 * Pure display component for work progress steps.
 * Shows steps in order with status and timing info.
 *
 * Entity UI rules:
 * - No router dependencies (useNavigate, Link)
 * - No mutation hooks
 * - No feature-specific action buttons (use renderActions prop)
 * - Receives all data via props
 */

import { useMemo, type ReactNode } from 'react';
import { Card, Icon } from '@/shared/ui';
import type { WorkProgressStep } from '../model/work-progress-step';
import { stepRules } from '../model/work-progress-sheet';
import { StepStatusBadge } from './StepStatusBadge';
import { formatDateTime } from '@/shared/lib/formatting/date';

/**
 * Build a map of step ID to its nesting level based on parent relationships.
 * Root steps (no parent) have level 0, their children have level 1, etc.
 */
function buildNestingLevels(steps: readonly WorkProgressStep[]): Map<number, number> {
  const stepById = new Map(steps.map(s => [s.id, s]));
  const levels = new Map<number, number>();

  const getLevel = (stepId: number, visited: Set<number> = new Set()): number => {
    if (levels.has(stepId)) {
      return levels.get(stepId)!;
    }
    if (visited.has(stepId)) {
      return 0; // Prevent infinite recursion in case of cycles
    }
    visited.add(stepId);

    const step = stepById.get(stepId);
    if (!step || step.parentStepId == null) {
      levels.set(stepId, 0);
      return 0;
    }

    const parentLevel = getLevel(step.parentStepId, visited);
    const level = parentLevel + 1;
    levels.set(stepId, level);
    return level;
  };

  steps.forEach(step => getLevel(step.id));
  return levels;
}

/**
 * Get parent step name for display.
 */
function getParentStepName(step: WorkProgressStep, steps: readonly WorkProgressStep[]): string | null {
  if (step.parentStepId == null) return null;
  const parent = steps.find(s => s.id === step.parentStepId);
  return parent?.stepName ?? null;
}

export interface WorkProgressStepListProps {
  /**
   * Work progress steps to display.
   */
  steps: readonly WorkProgressStep[];

  /**
   * Called when a step is clicked.
   */
  onStepClick?: (step: WorkProgressStep) => void;

  /**
   * Optional render function for action buttons.
   * Allows parent to inject feature-specific actions.
   */
  renderActions?: (step: WorkProgressStep) => ReactNode;

  /**
   * Empty state message when no steps.
   */
  emptyMessage?: string;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * List component for displaying work progress steps.
 *
 * @example
 * ```tsx
 * function SheetDetailPage() {
 *   const { data: sheet } = useQuery(workProgressQueries.detail(id));
 *
 *   return (
 *     <WorkProgressStepList
 *       steps={sheet?.steps ?? []}
 *       onStepClick={(step) => setSelectedStep(step)}
 *       renderActions={(step) => (
 *         <>
 *           {stepRules.canStart(step) && <StartButton step={step} />}
 *           {stepRules.canComplete(step) && <CompleteButton step={step} />}
 *         </>
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function WorkProgressStepList({
  steps,
  onStepClick,
  renderActions,
  emptyMessage = '등록된 공정이 없습니다.',
  className,
}: Readonly<WorkProgressStepListProps>) {
  // Calculate nesting levels for tree visualization
  const nestingLevels = useMemo(() => buildNestingLevels(steps), [steps]);

  if (steps.length === 0) {
    return (
      <Card className={className}>
        <div className="p-4 text-center text-steel-400">
          {emptyMessage}
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      {steps.map(step => {
        const nestingLevel = nestingLevels.get(step.id) ?? 0;
        const parentName = getParentStepName(step, steps);
        const hasParent = step.parentStepId != null;

        return (
          <Card
            key={step.id}
            className={`p-4 ${onStepClick ? 'cursor-pointer hover:bg-steel-800/50' : ''}`}
            style={{ marginLeft: `${nestingLevel * 24}px` }}
            onClick={onStepClick ? () => onStepClick(step) : undefined}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Step info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Dependency indicator */}
                  {hasParent && (
                    <Icon name="corner-down-right" className="h-4 w-4 text-steel-500" />
                  )}
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-steel-700 text-steel-200 text-sm font-medium rounded">
                    {step.stepNumber}
                  </span>
                  <span className="font-medium text-white">{step.stepName}</span>
                  <StepStatusBadge status={step.status} size="sm" />
                  {step.isOutsourced && (
                    <span className="px-1.5 py-0.5 bg-orange-900/30 text-orange-400 text-xs rounded">
                      외주
                    </span>
                  )}
                </div>

                {/* Parent dependency info */}
                {parentName && (
                  <div className="text-xs text-steel-500 mb-1">
                    선행 공정: {parentName}
                  </div>
                )}

                {/* Timing info */}
                <div className="text-sm text-steel-400 space-y-0.5">
                  {step.startedAt && (
                    <div>시작: {formatDateTime(step.startedAt)}</div>
                  )}
                  {step.completedAt && (
                    <div>
                      완료: {formatDateTime(step.completedAt)}
                      {step.completedByName && ` (${step.completedByName})`}
                    </div>
                  )}
                  {step.estimatedHours != null && (
                    <div>예상: {stepRules.formatDuration(step.estimatedHours)}</div>
                  )}
                  {step.actualHours != null && (
                    <div>실제: {stepRules.formatDuration(step.actualHours)}</div>
                  )}
                </div>

                {/* Outsource info */}
                {step.isOutsourced && step.outsourceVendorName && (
                  <div className="mt-2 text-sm text-orange-400">
                    외주업체: {step.outsourceVendorName}
                    {step.outsourceEta && ` (예정: ${step.outsourceEta})`}
                  </div>
                )}

                {/* Notes */}
                {step.notes && (
                  <div className="mt-2 text-sm text-steel-400 italic">
                    {step.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              {renderActions && (
                <div
                  className="flex gap-1"
                  onClick={e => e.stopPropagation()}
                >
                  {renderActions(step)}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
