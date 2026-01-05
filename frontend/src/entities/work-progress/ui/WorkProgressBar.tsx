/**
 * Work Progress Bar Component.
 *
 * Visual indicator of work progress completion.
 * Shows completed steps vs total steps.
 */

import type { WorkProgressSheet, WorkProgressSheetListItem } from '../model/work-progress-sheet';
import { workProgressRules } from '../model/work-progress-sheet';

/**
 * Props for WorkProgressBar.
 */
export interface WorkProgressBarProps {
  /**
   * The work progress sheet to show progress for.
   * Can be full sheet or list item.
   */
  sheet: WorkProgressSheet | WorkProgressSheetListItem;

  /**
   * Whether to show progress text (e.g., "3 / 5 (60%)").
   * @default true
   */
  showText?: boolean;

  /**
   * Size variant.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS class names.
   */
  className?: string;
}

/**
 * Progress bar showing work completion.
 *
 * Features:
 * - Visual progress based on completed/total steps
 * - Color coding based on completion status
 * - Optional text showing progress info
 *
 * @example
 * ```tsx
 * <WorkProgressBar sheet={sheet} />
 * <WorkProgressBar sheet={sheet} showText={false} size="sm" />
 * ```
 */
export function WorkProgressBar({
  sheet,
  showText = true,
  size = 'md',
  className = '',
}: Readonly<WorkProgressBarProps>) {
  // Handle both full sheet and list item
  const isListItem = 'progressPercentage' in sheet;
  const percentage = isListItem
    ? sheet.progressPercentage
    : workProgressRules.calculateProgress(sheet as WorkProgressSheet);
  const completedSteps = isListItem
    ? sheet.completedSteps
    : workProgressRules.getCompletedStepCount(sheet as WorkProgressSheet);
  const totalSteps = isListItem
    ? sheet.totalSteps
    : (sheet as WorkProgressSheet).steps.length;

  // Height classes based on size
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  // Color based on progress
  const getBarColor = () => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage > 0) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`${heightClasses[size]} ${getBarColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showText && (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {completedSteps} / {totalSteps} ({percentage}%)
        </span>
      )}
    </div>
  );
}
