/**
 * Approval Level List Component.
 *
 * Displays approval levels with their status.
 * Read-only component, no action buttons.
 */

import type { ApprovalLevel } from '../model';
import { approvalLevelRules, ApprovalStatusConfig } from '../model';

/**
 * Props for ApprovalLevelList.
 */
export interface ApprovalLevelListProps {
  /**
   * List of approval levels to display.
   */
  levels: readonly ApprovalLevel[];

  /**
   * Current level number (1-indexed).
   */
  currentLevel: number;

  /**
   * Whether to show detailed info (approver name, comments).
   * @default true
   */
  detailed?: boolean;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

/**
 * List component for displaying approval levels.
 *
 * Features:
 * - Visual step indicator
 * - Status badges for each level
 * - Highlight current level
 *
 * @example
 * ```tsx
 * <ApprovalLevelList
 *   levels={approval.levels}
 *   currentLevel={approval.currentLevel}
 * />
 * ```
 */
export function ApprovalLevelList({
  levels,
  currentLevel,
  detailed = true,
  className = '',
}: Readonly<ApprovalLevelListProps>) {
  if (!levels?.length) {
    return <div className={`text-gray-500 text-sm ${className}`}>결재 정보가 없습니다.</div>;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {levels.map(level => {
        const isCurrent = level.levelOrder === currentLevel;
        const isApproved = approvalLevelRules.isApproved(level);
        const isRejected = approvalLevelRules.isRejected(level);
        const isPending = approvalLevelRules.isPending(level);
        const statusConfig = level.decision ? ApprovalStatusConfig[level.decision] : null;

        return (
          <div
            key={level.levelOrder}
            className={`
              flex items-start gap-3 p-3 rounded-lg border
              ${isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
            `}
          >
            {/* Level indicator */}
            <div
              className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isApproved ? 'bg-green-100 text-green-700' : ''}
                ${isRejected ? 'bg-red-100 text-red-700' : ''}
                ${isPending ? 'bg-gray-100 text-gray-600' : ''}
                ${isCurrent && isPending ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' : ''}
              `}
            >
              {level.levelOrder}
            </div>

            {/* Level info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {level.levelName || level.expectedApproverName || `Level ${level.levelOrder}`}
                </span>
                {statusConfig && (
                  <span
                    className={`
                      px-2 py-0.5 text-xs rounded-full
                      ${isApproved ? 'bg-green-100 text-green-700' : ''}
                      ${isRejected ? 'bg-red-100 text-red-700' : ''}
                      ${isPending ? 'bg-yellow-100 text-yellow-700' : ''}
                    `}
                  >
                    {statusConfig.labelKo}
                  </span>
                )}
              </div>

              {detailed && (
                <>
                  {level.expectedApproverName && (
                    <p className="text-sm text-gray-500">{level.expectedApproverName}</p>
                  )}
                  {level.comments && (
                    <p className="mt-1 text-sm text-gray-600 italic">"{level.comments}"</p>
                  )}
                  {level.decidedAt && (
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(level.decidedAt).toLocaleString('ko-KR')}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Status icon */}
            <div className="flex-shrink-0">
              {isApproved && (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {isRejected && (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {isPending && isCurrent && (
                <svg
                  className="w-5 h-5 text-blue-500 animate-pulse"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
