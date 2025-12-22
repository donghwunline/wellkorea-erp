/**
 * Approval List Page
 *
 * Displays pending approval requests for the current user.
 * Allows approving or rejecting requests.
 *
 * Route: /approvals
 *
 * 4-Tier State Separation:
 * - Tier 1 (Local UI State): Modal open/close, selected approval
 * - Tier 2 (Page UI State): Pagination/filters -> Local state
 * - Tier 3 (Server State): Approval list -> useApprovalList hook
 * - Tier 4 (App Global State): Not used directly here
 */

import { useCallback, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, FilterBar, LoadingState, PageHeader, Pagination } from '@/components/ui';
import {
  ApprovalRejectModal,
  ApprovalRequestCard,
  useApprovalActions,
  useApprovalList,
} from '@/components/features/approval';
import type { ApprovalDetails, ApprovalStatus } from '@/services';

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
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | undefined>(undefined);
  const [refreshTrigger, triggerRefresh] = useReducer((x: number) => x + 1, 0);

  // Server state via hook
  const {
    approvals,
    pagination,
    isLoading,
    error: fetchError,
    refetch,
  } = useApprovalList({ page, status: statusFilter, refreshTrigger });

  // Local UI State
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<ApprovalDetails | null>(null);

  // Actions hook
  const {
    isLoading: isActing,
    error: actionError,
    approve,
    reject,
    clearError: clearActionError,
  } = useApprovalActions();

  // Clear messages after delay
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Handle filter change
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value ? (value as ApprovalStatus) : undefined);
    setPage(0);
  }, []);

  // Handle approve
  const handleApprove = useCallback(
    async (id: number) => {
      try {
        await approve(id);
        showSuccess('Approval submitted successfully');
        triggerRefresh();
      } catch {
        setError('Failed to approve');
      }
    },
    [approve, showSuccess]
  );

  // Handle reject - open modal
  const handleRejectClick = useCallback(
    (id: number) => {
      const approval = approvals.find(a => a.id === id);
      if (approval) {
        setRejectModal(approval);
      }
    },
    [approvals]
  );

  // Handle reject confirm
  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!rejectModal) return;

      try {
        await reject(rejectModal.id, reason);
        showSuccess('Rejection submitted successfully');
        setRejectModal(null);
        triggerRefresh();
      } catch {
        // Error displayed in modal via actionError
      }
    },
    [rejectModal, reject, showSuccess]
  );

  // Handle view entity
  const handleViewEntity = useCallback(
    (approval: ApprovalDetails) => {
      if (approval.entityType === 'QUOTATION') {
        navigate(`/quotations/${approval.entityId}`);
      }
    },
    [navigate]
  );

  // Check if current user can act on approval
  const canActOnApproval = useCallback((approval: ApprovalDetails): boolean => {
    // User can act if the current level decision is PENDING
    const levels = approval.levels ?? [];
    const currentLevelDecision = levels.find(l => l.levelOrder === approval.currentLevel);
    return currentLevelDecision?.decision === 'PENDING';
  }, []);

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="Approval Requests"
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
      {(error || actionError) && (
        <Alert
          variant="error"
          className="mb-6"
          onClose={() => {
            setError(null);
            clearActionError();
          }}
        >
          {error || actionError}
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
          <p className="text-red-400">{fetchError}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            Retry
          </button>
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
                onApprove={handleApprove}
                onReject={handleRejectClick}
                onViewEntity={handleViewEntity}
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
      <ApprovalRejectModal
        isOpen={!!rejectModal}
        entityRef={rejectModal?.entityDescription ?? undefined}
        isSubmitting={isActing}
        error={actionError}
        onClose={() => {
          setRejectModal(null);
          clearActionError();
        }}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
