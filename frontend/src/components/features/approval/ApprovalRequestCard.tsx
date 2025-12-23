/**
 * Approval Request Card - Feature Component
 *
 * Responsibilities:
 * - Display pending approval request details
 * - Show approval timeline with all levels
 * - Provide approve/reject actions
 *
 * This component is a presentation component that receives data from parent.
 */

import type { ApprovalDetails, LevelDecision } from '@/services';
import { Badge, Button, Card, Icon, Spinner } from '@/components/ui';
import { formatDateTime } from '@/shared/utils';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_BADGE_VARIANTS } from './approvalUtils';

export interface ApprovalRequestCardProps {
  /** Approval details */
  approval: ApprovalDetails;
  /** Whether the current user can approve/reject */
  canAct?: boolean;
  /** Whether an action is in progress */
  isActing?: boolean;
  /** Called when user approves */
  onApprove?: (id: number) => void;
  /** Called when user rejects */
  onReject?: (id: number) => void;
  /** Called when user clicks to view the entity */
  onViewEntity?: (approval: ApprovalDetails) => void;
}

/**
 * Card displaying a pending approval request.
 */
export function ApprovalRequestCard({
  approval,
  canAct = false,
  isActing = false,
  onApprove,
  onReject,
  onViewEntity,
}: Readonly<ApprovalRequestCardProps>) {
  // Get levels array (with null safety)
  const levels: LevelDecision[] = approval.levels ?? [];

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="border-b border-steel-700/50 bg-steel-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="info">{approval.entityType}</Badge>
            <span className="font-medium text-white">
              {approval.entityDescription || `#${approval.entityId}`}
            </span>
          </div>
          <Badge variant={APPROVAL_STATUS_BADGE_VARIANTS[approval.status]}>
            {APPROVAL_STATUS_LABELS[approval.status]}
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
            <p className="text-steel-300">{APPROVAL_STATUS_LABELS[approval.status]}</p>
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
        <div className="flex gap-3">
          {onViewEntity && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewEntity(approval)}
              disabled={isActing}
            >
              <Icon name="eye" className="mr-2 h-4 w-4" />
              View Details
            </Button>
          )}

          {canAct && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onApprove?.(approval.id)}
                disabled={isActing}
              >
                {isActing ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Icon name="check" className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                variant="warning"
                size="sm"
                onClick={() => onReject?.(approval.id)}
                disabled={isActing}
              >
                <Icon name="x-mark" className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
