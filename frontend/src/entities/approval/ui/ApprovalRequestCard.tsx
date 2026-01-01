/**
 * Approval Request Card.
 *
 * Display component for pending approval request details.
 * Pure presentational - receives all data via props.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives all data via props
 * - Actions delegated via callbacks
 */

import { Badge, Button, Card, Icon, Spinner } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/formatting';
import type { Approval, ApprovalLevel } from '../model';
import { ApprovalStatusConfig, EntityTypeConfigs } from '../model';

export interface ApprovalRequestCardProps {
  /**
   * Approval to display.
   */
  approval: Approval;

  /**
   * Whether the current user can approve/reject.
   * @default false
   */
  canAct?: boolean;

  /**
   * Whether an action is in progress.
   * @default false
   */
  isActing?: boolean;

  /**
   * Called when user approves.
   */
  onApprove?: () => void;

  /**
   * Called when user rejects.
   */
  onReject?: () => void;

  /**
   * Called when user clicks to view the entity.
   */
  onViewEntity?: () => void;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Card displaying a pending approval request.
 *
 * Features:
 * - Entity type badge
 * - Status badge
 * - Approval timeline with level indicators
 * - Level progress visualization
 * - Comments section
 * - Approve/Reject action buttons
 *
 * @example
 * ```tsx
 * <ApprovalRequestCard
 *   approval={approval}
 *   canAct={canApproveOrReject}
 *   isActing={isActing}
 *   onApprove={handleApprove}
 *   onReject={() => setShowRejectModal(true)}
 * />
 * ```
 */
export function ApprovalRequestCard({
  approval,
  canAct = false,
  isActing = false,
  onApprove,
  onReject,
  onViewEntity,
  className = '',
}: Readonly<ApprovalRequestCardProps>) {
  // Get levels array (with null safety)
  const levels: readonly ApprovalLevel[] = approval.levels ?? [];

  // Get entity type config
  const entityTypeConfig = EntityTypeConfigs[approval.entityType];

  // Get status config
  const statusConfig = ApprovalStatusConfig[approval.status];

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-b border-steel-700/50 bg-steel-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="info">{entityTypeConfig?.labelKo ?? approval.entityType}</Badge>
            <span className="font-medium text-white">
              {approval.entityDescription || `#${approval.entityId}`}
            </span>
          </div>
          <Badge variant={getStatusBadgeVariant(approval.status)}>
            {statusConfig?.labelKo ?? approval.status}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Entity Summary */}
        <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <span className="text-steel-500">Submitted By</span>
            <p className="font-medium text-white">{approval.submittedByName}</p>
          </div>
          <div>
            <span className="text-steel-500">Submitted At</span>
            <p className="text-steel-300">{formatDateTime(approval.submittedAt)}</p>
          </div>
          <div>
            <span className="text-steel-500">Current Level</span>
            <p className="text-steel-300">
              Level {approval.currentLevel} of {approval.totalLevels}
            </p>
          </div>
          <div>
            <span className="text-steel-500">Status</span>
            <p className="text-steel-300">{statusConfig?.labelKo ?? approval.status}</p>
          </div>
        </div>

        {/* Approval Timeline */}
        {levels.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium text-steel-400">Approval Progress</h4>
            <div className="flex items-center gap-2">
              {levels.map((level, index) => (
                <div key={level.levelOrder} className="flex items-center gap-2">
                  {/* Level indicator */}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                      level.decision === 'APPROVED'
                        ? 'bg-green-500/20 text-green-400'
                        : level.decision === 'REJECTED'
                          ? 'bg-red-500/20 text-red-400'
                          : level.levelOrder === approval.currentLevel
                            ? 'bg-copper-500/20 text-copper-400 ring-2 ring-copper-500/50'
                            : 'bg-steel-700/50 text-steel-400'
                    }`}
                  >
                    {level.decision === 'APPROVED' ? (
                      <Icon name="check" className="h-4 w-4" />
                    ) : level.decision === 'REJECTED' ? (
                      <Icon name="x-mark" className="h-4 w-4" />
                    ) : (
                      level.levelOrder
                    )}
                  </div>

                  {/* Connector line */}
                  {index < levels.length - 1 && (
                    <div
                      className={`h-0.5 w-8 ${
                        level.decision === 'APPROVED'
                          ? 'bg-green-500/50'
                          : level.decision === 'REJECTED'
                            ? 'bg-red-500/50'
                            : 'bg-steel-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Level details */}
            <div className="mt-2 text-xs text-steel-500">
              {levels.map(level => (
                <span key={level.levelOrder} className="mr-4">
                  L{level.levelOrder}: {level.decidedByName || level.expectedApproverName}
                  {level.decidedAt && ` (${formatDateTime(level.decidedAt)})`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last decision comment (if any) */}
        {levels.some(l => l.comments) && (
          <div className="mb-4 rounded-lg bg-steel-800/30 p-3">
            <div className="flex items-start gap-2 text-sm">
              <Icon name="information-circle" className="mt-0.5 h-4 w-4 text-steel-500" />
              <div>
                {levels
                  .filter(l => l.comments)
                  .slice(-1)
                  .map(level => (
                    <div key={level.levelOrder}>
                      <span className="text-steel-400">
                        {level.decidedByName || level.expectedApproverName}:{' '}
                      </span>
                      <span className="text-steel-300">{level.decision}</span>
                      <p className="mt-1 text-steel-500">"{level.comments}"</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            {onViewEntity && (
              <Button variant="secondary" size="sm" onClick={onViewEntity} disabled={isActing}>
                <Icon name="eye" className="mr-2 h-4 w-4" />
                View Details
              </Button>
            )}
          </div>

          {canAct && (
            <div className="flex gap-3">
              <Button variant="primary" size="sm" onClick={onApprove} disabled={isActing}>
                {isActing ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Icon name="check" className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button variant="warning" size="sm" onClick={onReject} disabled={isActing}>
                <Icon name="x-mark" className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Map approval status to badge variant.
 */
function getStatusBadgeVariant(status: string): 'success' | 'danger' | 'warning' | 'info' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'PENDING':
      return 'warning';
    default:
      return 'info';
  }
}
