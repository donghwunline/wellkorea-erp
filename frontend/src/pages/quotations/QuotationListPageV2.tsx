/**
 * Quotation List Page (FSD-Lite Version)
 *
 * Displays all quotations across all projects.
 * Allows filtering by status and navigating to details.
 *
 * Route: /quotations
 *
 * Architecture Notes:
 * - Page = assembly layer (combines entities, features, widgets)
 * - Data fetching via TanStack Query (useQuotations hook)
 * - Actions via feature mutation hooks
 * - No refreshTrigger pattern - uses query invalidation
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, ConfirmationModal, Icon, PageHeader, Pagination, SearchBar } from '@/components/ui';
import { FilterBar } from '@/components/ui/navigation/FilterBar';
import { EmailNotificationModal } from '@/components/features/quotations';
import { usePaginatedSearch } from '@/shared/hooks';

// Entity imports - domain model and UI
import {
  QuotationTable,
  quotationRules,
  useQuotations,
  type QuotationStatus,
  type Quotation,
} from '@/entities/quotation';

// Feature imports - user actions
import {
  useSubmitQuotation,
  useCreateVersion,
  useDownloadPdf,
  useSendNotification,
} from '@/features/quotation';

import { Icon as ActionIcon, IconButton } from '@/components/ui';

// Status filter options
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SENT', label: 'Sent' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function QuotationListPageV2() {
  const navigate = useNavigate();

  // Page UI State - pagination and search
  const {
    page,
    setPage,
    search,
    searchInput,
    handleSearchChange,
    handleSearchSubmit,
    handleClearSearch,
  } = usePaginatedSearch();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | null>(null);

  // Local UI State - modals
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitConfirm, setSubmitConfirm] = useState<Quotation | null>(null);
  const [versionConfirm, setVersionConfirm] = useState<Quotation | null>(null);
  const [emailConfirm, setEmailConfirm] = useState<Quotation | null>(null);

  // Query hook - fetches quotation list
  const {
    data,
    isLoading,
    error,
  } = useQuotations({
    page,
    search,
    status: statusFilter,
  });

  // Mutation hooks - feature actions
  const submitMutation = useSubmitQuotation({
    onSuccess: () => {
      showSuccess(`Quotation submitted for approval`);
      setSubmitConfirm(null);
    },
  });

  const versionMutation = useCreateVersion({
    onSuccess: (result) => {
      showSuccess('New version created');
      setVersionConfirm(null);
      navigate(`/quotations/${result.id}/edit`);
    },
  });

  const pdfMutation = useDownloadPdf({
    onError: () => showSuccess('Failed to download PDF'), // TODO: Show error toast instead
  });

  const notifyMutation = useSendNotification({
    onSuccess: () => {
      showSuccess('Email notification sent');
      setEmailConfirm(null);
    },
    onError: () => showSuccess('Failed to send email notification'), // TODO: Show error toast instead
  });

  // Helper to show success message
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Handle filter change
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setStatusFilter(value ? (value as QuotationStatus) : null);
      setPage(0);
    },
    [setPage]
  );

  // Render action buttons for each quotation row
  const renderActions = useCallback(
    (quotation: Quotation) => (
      <>
        {/* View - always available */}
        <IconButton
          onClick={() => navigate(`/quotations/${quotation.id}`)}
          aria-label="View quotation"
          title="View quotation"
        >
          <ActionIcon name="eye" className="h-4 w-4" />
        </IconButton>

        {/* Edit - only for DRAFT */}
        {quotationRules.canEdit(quotation) && (
          <IconButton
            onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
            aria-label="Edit quotation"
            title="Edit quotation"
          >
            <ActionIcon name="pencil" className="h-4 w-4" />
          </IconButton>
        )}

        {/* Submit for approval - only for DRAFT */}
        {quotationRules.canSubmit(quotation) && (
          <IconButton
            onClick={() => setSubmitConfirm(quotation)}
            variant="primary"
            aria-label="Submit for approval"
            title="Submit for approval"
          >
            <ActionIcon name="paper-airplane" className="h-4 w-4" />
          </IconButton>
        )}

        {/* Download PDF - only for non-DRAFT */}
        {quotationRules.canGeneratePdf(quotation) && (
          <IconButton
            onClick={() =>
              pdfMutation.mutate({
                quotationId: quotation.id,
                filename: `${quotation.jobCode}_v${quotation.version}.pdf`,
              })
            }
            aria-label="Download PDF"
            title="Download PDF"
          >
            <ActionIcon name="document-arrow-down" className="h-4 w-4" />
          </IconButton>
        )}

        {/* Send email - only for APPROVED or SENT */}
        {quotationRules.canSend(quotation) && (
          <IconButton
            onClick={() => setEmailConfirm(quotation)}
            aria-label="Send email"
            title="Send email"
          >
            <ActionIcon name="envelope" className="h-4 w-4" />
          </IconButton>
        )}

        {/* Create new version */}
        {quotationRules.canCreateNewVersion(quotation) && (
          <IconButton
            onClick={() => setVersionConfirm(quotation)}
            aria-label="Create new version"
            title="Create new version"
          >
            <ActionIcon name="document-duplicate" className="h-4 w-4" />
          </IconButton>
        )}
      </>
    ),
    [navigate, pdfMutation]
  );

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title="견적" description="View and manage all quotations" />
        <PageHeader.Actions>
          <Button onClick={() => navigate('/quotations/create')}>
            <Icon name="plus" className="h-5 w-5" />
            New Quotation
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchBar
          value={searchInput}
          onValueChange={handleSearchChange}
          onClear={handleClearSearch}
          placeholder="Search by job code, project name..."
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
        />
        <FilterBar>
          <FilterBar.Select
            options={STATUS_OPTIONS}
            value={statusFilter || ''}
            onValueChange={handleStatusFilterChange}
            placeholder="All Statuses"
          />
        </FilterBar>
        <Button variant="secondary" onClick={handleSearchSubmit}>
          Search
        </Button>
      </div>

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
        <div className="text-center py-8 text-steel-400">Loading quotations...</div>
      ) : (
        <>
          {/* Quotations Table */}
          <QuotationTable
            quotations={data?.data ?? []}
            onRowClick={(quotation) => navigate(`/quotations/${quotation.id}`)}
            renderActions={renderActions}
            emptyMessage={statusFilter ? 'No quotations found with selected status.' : 'No quotations found.'}
          />

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalItems={data.totalElements}
                itemsPerPage={data.size}
                onPageChange={setPage}
                isFirst={data.first}
                isLast={data.last}
                itemLabel="quotations"
              />
            </div>
          )}
        </>
      )}

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!submitConfirm}
        title="Submit for Approval"
        message={`Are you sure you want to submit "${submitConfirm?.jobCode}" for approval? This will start the approval workflow.`}
        confirmLabel="Submit"
        onConfirm={() => { if (submitConfirm) submitMutation.mutate(submitConfirm.id); }}
        onClose={() => setSubmitConfirm(null)}
        variant="warning"
      />

      {/* Create Version Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!versionConfirm}
        title="Create New Version"
        message={`Create a new version based on "${versionConfirm?.jobCode} v${versionConfirm?.version}"? The new version will be in DRAFT status.`}
        confirmLabel="Create Version"
        onConfirm={() => { if (versionConfirm) versionMutation.mutate(versionConfirm.id); }}
        onClose={() => setVersionConfirm(null)}
        variant="warning"
      />

      {/* Send Email Confirmation Modal */}
      <EmailNotificationModal
        isOpen={!!emailConfirm}
        onClose={() => setEmailConfirm(null)}
        onSend={() => { if (emailConfirm) notifyMutation.mutate(emailConfirm.id); }}
        quotationInfo={emailConfirm ? { jobCode: emailConfirm.jobCode, version: emailConfirm.version } : undefined}
        isLoading={notifyMutation.isPending}
      />
    </div>
  );
}
