/**
 * Approval Progress Bar Component.
 *
 * Visual indicator of approval workflow progress.
 * Shows current level vs total levels.
 */

import { useTranslation } from 'react-i18next';
import type { Approval } from '../model/approval';
import { approvalRules } from '../model/approval';

/**
 * Props for ApprovalProgressBar.
 */
export interface ApprovalProgressBarProps {
  /**
   * The approval to show progress for.
   */
  approval: Approval;

  /**
   * Whether to show level text (e.g., "2 / 3").
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
 * Progress bar showing approval workflow completion.
 *
 * Features:
 * - Visual progress based on current/total levels
 * - Color coding based on approval status
 * - Optional text showing level info
 *
 * @example
 * ```tsx
 * <ApprovalProgressBar approval={approval} />
 * <ApprovalProgressBar approval={approval} showText={false} size="sm" />
 * ```
 */
export function ApprovalProgressBar({
  approval,
  showText = true,
  size = 'md',
  className = '',
}: Readonly<ApprovalProgressBarProps>) {
  const { t } = useTranslation('entities');
  const percentage = approvalRules.getProgressPercentage(approval);
  const isPending = approvalRules.isPending(approval);
  const isApproved = approvalRules.isApproved(approval);
  const isRejected = approvalRules.isRejected(approval);

  // Height classes based on size
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  // Color based on status
  const getBarColor = () => {
    if (isRejected) return 'bg-red-500';
    if (isApproved) return 'bg-green-500';
    return 'bg-blue-500';
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
          {approval.currentLevel} / {approval.totalLevels}
          {isPending && ` ${t('approval.progressBar.step')}`}
        </span>
      )}
    </div>
  );
}
