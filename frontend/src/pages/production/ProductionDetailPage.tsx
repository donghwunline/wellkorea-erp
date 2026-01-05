/**
 * Production Detail Page (FSD-Lite Version)
 *
 * Displays work progress sheet details with step tracking.
 * Allows updating step status (start, complete, skip).
 *
 * Route: /production/:id
 *
 * Architecture Notes:
 * - Page = assembly layer (combines entities, features, widgets)
 * - Data fetching via TanStack Query
 * - Actions via feature mutation hooks
 */

import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  ConfirmationModal,
  Icon,
  IconButton,
  PageHeader,
} from '@/shared/ui';

// Entity imports - domain model and UI
import {
  workProgressQueries,
  WorkProgressStepList,
  WorkProgressBar,
  SheetStatusBadge,
  stepRules,
  type WorkProgressStep,
} from '@/entities/work-progress';
import { useAuth } from '@/entities/auth';

// Feature imports - user actions
import {
  useStartStep,
  useCompleteStep,
  useSkipStep,
  useResetStep,
} from '@/features/work-progress/update-step';
import { useDeleteSheet } from '@/features/work-progress/delete-sheet';

/**
 * Roles that can update production steps (start, complete, skip, reset, delete).
 * Sales and Finance can only view (read-only).
 */
const PRODUCTION_UPDATE_ROLES = ['ROLE_ADMIN', 'ROLE_PRODUCTION'] as const;

export function ProductionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const sheetId = id ? parseInt(id, 10) : 0;
  const { hasAnyRole } = useAuth();

  // Check if user can update production data
  const canUpdate = useMemo(() => hasAnyRole([...PRODUCTION_UPDATE_ROLES]), [hasAnyRole]);

  // Local UI State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [startConfirm, setStartConfirm] = useState<WorkProgressStep | null>(null);
  const [completeConfirm, setCompleteConfirm] = useState<WorkProgressStep | null>(null);
  const [skipConfirm, setSkipConfirm] = useState<WorkProgressStep | null>(null);
  const [resetConfirm, setResetConfirm] = useState<WorkProgressStep | null>(null);

  // Query hook - fetch sheet with steps
  const { data: sheet, isLoading, error } = useQuery(
    workProgressQueries.detail(sheetId)
  );

  // Mutation hooks
  const startMutation = useStartStep({
    onSuccess: () => {
      showSuccess('작업이 시작되었습니다');
      setStartConfirm(null);
    },
  });

  const completeMutation = useCompleteStep({
    onSuccess: () => {
      showSuccess('작업이 완료되었습니다');
      setCompleteConfirm(null);
    },
  });

  const skipMutation = useSkipStep({
    onSuccess: () => {
      showSuccess('작업을 건너뛰었습니다');
      setSkipConfirm(null);
    },
  });

  const resetMutation = useResetStep({
    onSuccess: () => {
      showSuccess('작업 상태가 초기화되었습니다');
      setResetConfirm(null);
    },
  });

  const deleteMutation = useDeleteSheet({
    onSuccess: () => {
      if (sheet) {
        navigate(`/projects/${sheet.projectId}/production`);
      } else {
        navigate('/production');
      }
    },
  });

  // Helper to show success message
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Render action buttons for each step (only if user can update)
  const renderStepActions = useCallback(
    (step: WorkProgressStep) => {
      // Read-only users don't see action buttons
      if (!canUpdate) {
        return null;
      }

      return (
        <>
          {/* Start - for NOT_STARTED steps */}
          {stepRules.canStart(step) && (
            <IconButton
              onClick={() => setStartConfirm(step)}
              variant="primary"
              aria-label="작업 시작"
              title="작업 시작"
            >
              <Icon name="play" className="h-4 w-4" />
            </IconButton>
          )}

          {/* Complete - for IN_PROGRESS steps */}
          {stepRules.canComplete(step) && (
            <IconButton
              onClick={() => setCompleteConfirm(step)}
              variant="primary"
              aria-label="작업 완료"
              title="작업 완료"
            >
              <Icon name="check" className="h-4 w-4" />
            </IconButton>
          )}

          {/* Skip - for NOT_STARTED or IN_PROGRESS steps */}
          {stepRules.canSkip(step) && (
            <IconButton
              onClick={() => setSkipConfirm(step)}
              aria-label="건너뛰기"
              title="건너뛰기"
            >
              <Icon name="forward" className="h-4 w-4" />
            </IconButton>
          )}

          {/* TODO: Add Outsource/Procurement action button
              - Opens modal to select vendor, set ETA, cost
              - Only available for steps where template.isOutsourceable = true
              - Updates step with isOutsourced=true, outsourceVendorId, outsourceEta, outsourceCost
              - Icon: "truck" or "building-office"
          */}

          {/* Reset - for non-NOT_STARTED steps */}
          {stepRules.canReset(step) && (
            <IconButton
              onClick={() => setResetConfirm(step)}
              aria-label="초기화"
              title="초기화"
            >
              <Icon name="arrow-path" className="h-4 w-4" />
            </IconButton>
          )}
        </>
      );
    },
    [canUpdate]
  );

  if (!sheetId) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">
          Invalid sheet ID
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="작업지 상세"
          description={sheet ? `${sheet.productName} (${sheet.productSku})` : 'Loading...'}
        />
        <PageHeader.Actions>
          <Button variant="secondary" onClick={() => sheet && navigate(`/projects/${sheet.projectId}/production`)}>
            <Icon name="arrow-left" className="h-5 w-5" />
            목록으로
          </Button>
          {canUpdate && (
            <Button variant="danger" onClick={() => setDeleteConfirm(true)}>
              <Icon name="trash" className="h-5 w-5" />
              삭제
            </Button>
          )}
        </PageHeader.Actions>
      </PageHeader>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" className="mb-6" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6">
          {error.message}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-8 text-steel-400">Loading...</div>
      ) : sheet ? (
        <div className="space-y-6">
          {/* Sheet Info Card */}
          <Card>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-steel-400">Job Code</div>
                  <div className="font-mono text-white">{sheet.jobCode}</div>
                </div>
                <div>
                  <div className="text-sm text-steel-400">순번</div>
                  <div className="text-white">{sheet.sequence}</div>
                </div>
                <div>
                  <div className="text-sm text-steel-400">수량</div>
                  <div className="text-white">{sheet.quantity}</div>
                </div>
                <div>
                  <div className="text-sm text-steel-400">상태</div>
                  <SheetStatusBadge status={sheet.status} />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="text-sm text-steel-400 mb-2">진행률</div>
                <WorkProgressBar sheet={sheet} size="lg" />
              </div>

              {/* Notes */}
              {sheet.notes && (
                <div className="mt-4">
                  <div className="text-sm text-steel-400">메모</div>
                  <div className="text-steel-300 mt-1">{sheet.notes}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Steps List */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">공정 목록</h3>
            <WorkProgressStepList
              steps={sheet.steps}
              renderActions={renderStepActions}
            />
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm}
        title="작업지 삭제"
        message="이 작업지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        onConfirm={() => {
          deleteMutation.mutate(sheetId);
          setDeleteConfirm(false);
        }}
        onClose={() => setDeleteConfirm(false)}
        variant="danger"
      />

      {/* Start Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!startConfirm}
        title="작업 시작"
        message={`"${startConfirm?.stepName}" 작업을 시작하시겠습니까?`}
        confirmLabel="시작"
        onConfirm={() => {
          if (startConfirm) {
            startMutation.mutate({ sheetId, stepId: startConfirm.id });
          }
        }}
        onClose={() => setStartConfirm(null)}
        variant="warning"
      />

      {/* Complete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!completeConfirm}
        title="작업 완료"
        message={`"${completeConfirm?.stepName}" 작업을 완료하시겠습니까?`}
        confirmLabel="완료"
        onConfirm={() => {
          if (completeConfirm) {
            completeMutation.mutate({ sheetId, stepId: completeConfirm.id });
          }
        }}
        onClose={() => setCompleteConfirm(null)}
        variant="warning"
      />

      {/* Skip Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!skipConfirm}
        title="작업 건너뛰기"
        message={`"${skipConfirm?.stepName}" 작업을 건너뛰시겠습니까?`}
        confirmLabel="건너뛰기"
        onConfirm={() => {
          if (skipConfirm) {
            skipMutation.mutate({ sheetId, stepId: skipConfirm.id });
          }
        }}
        onClose={() => setSkipConfirm(null)}
        variant="warning"
      />

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!resetConfirm}
        title="작업 초기화"
        message={`"${resetConfirm?.stepName}" 작업 상태를 초기화하시겠습니까?`}
        confirmLabel="초기화"
        onConfirm={() => {
          if (resetConfirm) {
            resetMutation.mutate({ sheetId, stepId: resetConfirm.id });
          }
        }}
        onClose={() => setResetConfirm(null)}
        variant="warning"
      />
    </div>
  );
}
