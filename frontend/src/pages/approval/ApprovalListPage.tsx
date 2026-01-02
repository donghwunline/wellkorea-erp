/**
 * Approval List Page
 *
 * Displays pending approval requests for the current user.
 * Allows approving or rejecting requests.
 *
 * Route: /approvals
 *
 * FSD Architecture:
 * - Page layer: URL params + layout assembly
 * - Uses entities/approval for query hooks and UI
 * - Uses features/approval for mutations
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Card, FilterBar, LoadingState, PageHeader, Pagination } from '@/shared/ui';
import {
  type Approval,
  ApprovalRequestCard,
  approvalQueries,
  type ApprovalStatus,
} from '@/entities/approval';
import { useApproveApproval } from '@/features/approval/approve';
import { RejectModal, useRejectApproval } from '@/features/approval/reject';

// Status filter options
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function ApprovalListPage() {
  const navigate = useNavigate();

  // Page state
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | null>(null);

  // Server state via TanStack Query
  const {
    data: approvalsData,
    isLoading,
    error: fetchError,
  } = useQuery(
    approvalQueries.list({
      page,
      size: 10,
      status: statusFilter,
      myPending: true,
    })
  );

  const approvals = approvalsData?.data ?? [];
  const pagination = approvalsData?.pagination;

  // Local UI State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<Approval | null>(null);

  // Mutation hooks
  const {
    mutate: approveApproval,
    isPending: isApproving,
    error: approveError,
    reset: resetApproveError,
  } = useApproveApproval({
    onSuccess: () => showSuccess('Approval submitted successfully'),
  });

  const {
    mutate: rejectApproval,
    isPending: isRejecting,
    error: rejectError,
    reset: resetRejectError,
  } = useRejectApproval({
    onSuccess: () => {
      showSuccess('Rejection submitted successfully');
      setRejectModal(null);
    },
  });

  const isActing = isApproving || isRejecting;
  const actionError = approveError?.message ?? rejectError?.message ?? null;

  // Clear messages after delay
  const showSuccess = useCallback(
    (message: string) => {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    [setSuccessMessage]
  );

  // Handle filter change
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setStatusFilter(value ? (value as ApprovalStatus) : null);
      setPage(0);
    },
    [setStatusFilter, setPage]
  );

  // Handle approve from card (receives approval via closure)
  const handleApproveFromCard = useCallback(
    (approval: Approval) => {
      approveApproval({ id: approval.id });
    },
    [approveApproval]
  );

  // Handle reject - open modal
  const handleRejectClick = useCallback(
    (approval: Approval) => {
      setRejectModal(approval);
    },
    [setRejectModal]
  );

  // Handle reject confirm
  const handleRejectConfirm = useCallback(
    (reason: string) => {
      if (!rejectModal) return;
      rejectApproval({ id: rejectModal.id, reason });
    },
    [rejectModal, rejectApproval]
  );

  // Handle view entity
  const handleViewEntity = useCallback(
    (approval: Approval) => {
      if (approval.entityType === 'QUOTATION') {
        navigate(`/quotations/${approval.entityId}`);
      }
    },
    [navigate]
  );

  // Clear action errors
  const clearActionError = useCallback(() => {
    resetApproveError();
    resetRejectError();
  }, [resetApproveError, resetRejectError]);

  // Check if current user can act on approval
  // Note: When using myPending=true filter, the backend already returns only
  // approvals where the current user is the expected approver at the current level.
  // So we only need to check if the approval status is PENDING.
  const canActOnApproval = useCallback((approval: Approval): boolean => {
    return approval.status === 'PENDING';
  }, []);

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="결재 대기 문서"
          description="Review and process pending approval requests"
        />
      </PageHeader>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        <FilterBar>
          <FilterBar.Field label="Status">
            <FilterBar.Select
              options={STATUS_OPTIONS}
              value={statusFilter || ''}
              onValueChange={handleStatusFilterChange}
              placeholder="All Statuses"
            />
          </FilterBar.Field>
        </FilterBar>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" className="mb-6" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {actionError && (
        <Alert variant="error" className="mb-6" onClose={clearActionError}>
          {actionError}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <LoadingState message="Loading approval requests..." />
        </Card>
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <Card className="p-8 text-center">
          <p className="text-red-400">{fetchError.message}</p>
        </Card>
      )}

      {/* Approvals List */}
      {!isLoading && !fetchError && (
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-steel-400">
                {statusFilter
                  ? 'No approval requests found with selected status.'
                  : 'No pending approval requests.'}
              </p>
            </Card>
          ) : (
            approvals.map(approval => (
              <ApprovalRequestCard
                key={approval.id}
                approval={approval}
                canAct={canActOnApproval(approval)}
                isActing={isActing}
                onApprove={() => handleApproveFromCard(approval)}
                onReject={() => handleRejectClick(approval)}
                onViewEntity={() => handleViewEntity(approval)}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalItems={pagination.totalElements}
            itemsPerPage={pagination.size}
            onPageChange={setPage}
            isFirst={pagination.first}
            isLast={pagination.last}
            itemLabel="approvals"
          />
        </div>
      )}

      {/* Reject Modal */}
      <RejectModal
        isOpen={!!rejectModal}
        entityRef={rejectModal?.entityDescription ?? undefined}
        isSubmitting={isRejecting}
        error={rejectError?.message}
        onClose={() => {
          setRejectModal(null);
          resetRejectError();
        }}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
