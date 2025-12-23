/**
 * Quotation List Page - Standalone
 *
 * Displays all quotations across all projects.
 * Allows filtering by status and navigating to details.
 *
 * Route: /quotations
 *
 * 4-Tier State Separation:
 * - Tier 1 (Local UI State): Modal open/close -> Local state
 * - Tier 2 (Page UI State): Search/pagination/filters -> usePaginatedSearch hook
 * - Tier 3 (Server State): Quotation list data -> QuotationTable feature component
 * - Tier 4 (App Global State): Not used directly here
 */

import { useCallback, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, ConfirmationModal, Icon, PageHeader, SearchBar } from '@/components/ui';
import { FilterBar } from '@/components/ui/navigation/FilterBar';
import { EmailNotificationModal, QuotationTable, useQuotationActions } from '@/components/features/quotations';
import { usePaginatedSearch } from '@/shared/hooks';
import type { QuotationDetails, QuotationStatus } from '@/services';

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

export function QuotationListPage() {
  const navigate = useNavigate();

  // Page UI State (Tier 2) - pagination and search
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
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | undefined>(undefined);

  // Refresh trigger - increment to signal table to refetch
  const [refreshTrigger, triggerRefresh] = useReducer((x: number) => x + 1, 0);

  // Local UI State (Tier 1)
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitConfirm, setSubmitConfirm] = useState<QuotationDetails | null>(null);
  const [versionConfirm, setVersionConfirm] = useState<QuotationDetails | null>(null);
  const [emailConfirm, setEmailConfirm] = useState<QuotationDetails | null>(null);

  // Actions hook
  const { isLoading: isActing, submitForApproval, createNewVersion, downloadPdf, sendRevisionNotification } = useQuotationActions();

  // Clear messages after delay
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Handle view quotation
  const handleView = useCallback(
    (quotation: QuotationDetails) => {
      navigate(`/quotations/${quotation.id}`);
    },
    [navigate]
  );

  // Handle edit quotation
  const handleEdit = useCallback(
    (quotation: QuotationDetails) => {
      navigate(`/quotations/${quotation.id}/edit`);
    },
    [navigate]
  );

  // Handle submit for approval
  const handleSubmit = useCallback((quotation: QuotationDetails) => {
    setSubmitConfirm(quotation);
  }, []);

  const handleSubmitConfirm = useCallback(async () => {
    if (!submitConfirm) return;

    await submitForApproval(submitConfirm.id);
    showSuccess(`Quotation ${submitConfirm.jobCode} submitted for approval`);
    setSubmitConfirm(null);
    triggerRefresh();
  }, [submitConfirm, submitForApproval, showSuccess]);

  // Handle create new version
  const handleCreateVersion = useCallback((quotation: QuotationDetails) => {
    setVersionConfirm(quotation);
  }, []);

  const handleVersionConfirm = useCallback(async () => {
    if (!versionConfirm) return;

    const result = await createNewVersion(versionConfirm.id);
    showSuccess('New version created');
    setVersionConfirm(null);
    triggerRefresh();
    // Navigate to edit the new version
    navigate(`/quotations/${result.id}/edit`);
  }, [versionConfirm, createNewVersion, showSuccess, navigate]);

  // Handle download PDF
  const handleDownloadPdf = useCallback(
    async (quotation: QuotationDetails) => {
      try {
        await downloadPdf(quotation.id, `${quotation.jobCode}_v${quotation.version}.pdf`);
      } catch {
        setError('Failed to download PDF');
      }
    },
    [downloadPdf]
  );

  // Handle send email - show confirmation modal
  const handleSendEmail = useCallback((quotation: QuotationDetails) => {
    setEmailConfirm(quotation);
  }, []);

  // Confirm send email
  const handleEmailConfirm = useCallback(async () => {
    if (!emailConfirm) return;

    try {
      await sendRevisionNotification(emailConfirm.id);
      showSuccess(`Email notification sent for "${emailConfirm.jobCode}"`);
      setEmailConfirm(null);
      triggerRefresh();
    } catch {
      setError('Failed to send email notification');
    }
  }, [emailConfirm, sendRevisionNotification, showSuccess]);

  // Handle filter change
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setStatusFilter(value ? (value as QuotationStatus) : undefined);
      setPage(0);
    },
    [setPage]
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
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Quotations Table */}
      <QuotationTable
        page={page}
        search={search}
        status={statusFilter}
        refreshTrigger={refreshTrigger}
        onPageChange={setPage}
        onView={handleView}
        onEdit={handleEdit}
        onSubmit={handleSubmit}
        onCreateVersion={handleCreateVersion}
        onDownloadPdf={handleDownloadPdf}
        onSendEmail={handleSendEmail}
        onError={setError}
      />

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!submitConfirm}
        title="Submit for Approval"
        message={`Are you sure you want to submit "${submitConfirm?.jobCode}" for approval? This will start the approval workflow.`}
        confirmLabel="Submit"
        onConfirm={handleSubmitConfirm}
        onClose={() => setSubmitConfirm(null)}
        variant="warning"
      />

      {/* Create Version Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!versionConfirm}
        title="Create New Version"
        message={`Create a new version based on "${versionConfirm?.jobCode} v${versionConfirm?.version}"? The new version will be in DRAFT status.`}
        confirmLabel="Create Version"
        onConfirm={handleVersionConfirm}
        onClose={() => setVersionConfirm(null)}
        variant="warning"
      />

      {/* Send Email Confirmation Modal */}
      <EmailNotificationModal
        isOpen={!!emailConfirm}
        onClose={() => setEmailConfirm(null)}
        onSend={handleEmailConfirm}
        quotationInfo={emailConfirm ? { jobCode: emailConfirm.jobCode, version: emailConfirm.version } : undefined}
        isLoading={isActing}
      />
    </div>
  );
}
