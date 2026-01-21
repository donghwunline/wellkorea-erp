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
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  ConfirmationModal,
  Icon as ActionIcon,
  IconButton,
  PageHeader,
  Pagination,
  SearchBar,
} from '@/shared/ui';
import { FilterBar } from '@/shared/ui/navigation/FilterBar';
import { usePaginatedSearch } from '@/shared/lib/pagination';

// Entity imports - domain model and UI
import { useQuery } from '@tanstack/react-query';
import {
  type QuotationListItem,
  quotationQueries,
  quotationRules,
  type QuotationStatus,
  QuotationTable,
} from '@/entities/quotation';

// Feature imports - user actions
import { useSubmitQuotation } from '@/features/quotation/submit';
import { useCreateVersion } from '@/features/quotation/version';
import { useDownloadPdf } from '@/features/quotation/download-pdf';
import { EmailNotificationModal, useSendNotification } from '@/features/quotation/notify';

export function QuotationListPage() {
  const { t } = useTranslation('quotations');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();

  // Status filter options (using i18n)
  const STATUS_OPTIONS = [
    { value: '', label: t('list.allStatuses') },
    { value: 'DRAFT', label: t('status.DRAFT') },
    { value: 'PENDING_APPROVAL', label: t('status.PENDING_APPROVAL') },
    { value: 'APPROVED', label: t('status.APPROVED') },
    { value: 'SENT', label: t('status.SENT') },
    { value: 'ACCEPTED', label: t('status.ACCEPTED') },
    { value: 'REJECTED', label: t('status.REJECTED') },
  ];

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
  const [submitConfirm, setSubmitConfirm] = useState<QuotationListItem | null>(null);
  const [versionConfirm, setVersionConfirm] = useState<QuotationListItem | null>(null);
  const [emailConfirm, setEmailConfirm] = useState<QuotationListItem | null>(null);

  // Query hook - fetches quotation list
  const { data, isLoading, error } = useQuery(
    quotationQueries.list({
      page,
      size: 10,
      search,
      status: statusFilter,
      projectId: null,
    })
  );

  // Mutation hooks - feature actions
  const submitMutation = useSubmitQuotation({
    onSuccess: () => {
      showSuccess(t('approval.submitSuccess'));
      setSubmitConfirm(null);
    },
  });

  const versionMutation = useCreateVersion({
    onSuccess: result => {
      showSuccess(t('version.createSuccess'));
      setVersionConfirm(null);
      navigate(`/quotations/${result.id}/edit`);
    },
  });

  const pdfMutation = useDownloadPdf({
    onError: () => showSuccess(t('actions.downloadPdf') + ' failed'), // TODO: Show error toast instead
  });

  const notifyMutation = useSendNotification({
    onSuccess: () => {
      showSuccess(t('email.sendSuccess'));
      setEmailConfirm(null);
    },
    onError: () => showSuccess(t('email.sendError')), // TODO: Show error toast instead
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
    (quotation: QuotationListItem) => (
      <>
        {/* View - always available */}
        <IconButton
          onClick={() => navigate(`/quotations/${quotation.id}`)}
          aria-label={t('actions.view')}
          title={t('actions.view')}
        >
          <ActionIcon name="eye" className="h-4 w-4" />
        </IconButton>

        {/* Edit - only for DRAFT */}
        {quotationRules.canEdit(quotation) && (
          <IconButton
            onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
            aria-label={t('actions.edit')}
            title={t('actions.edit')}
          >
            <ActionIcon name="pencil" className="h-4 w-4" />
          </IconButton>
        )}

        {/* Submit for approval - only for DRAFT */}
        {quotationRules.canSubmit(quotation) && (
          <IconButton
            onClick={() => setSubmitConfirm(quotation)}
            variant="primary"
            aria-label={t('actions.submit')}
            title={t('actions.submit')}
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
            aria-label={t('actions.downloadPdf')}
            title={t('actions.downloadPdf')}
          >
            <ActionIcon name="document-arrow-down" className="h-4 w-4" />
          </IconButton>
        )}

        {/* Send email - only for APPROVED or SENT */}
        {quotationRules.canSend(quotation) && (
          <IconButton
            onClick={() => setEmailConfirm(quotation)}
            aria-label={t('actions.sendEmail')}
            title={t('actions.sendEmail')}
          >
            <ActionIcon name="envelope" className="h-4 w-4" />
          </IconButton>
        )}

        {/* Create new version */}
        {quotationRules.canCreateNewVersion(quotation) && (
          <IconButton
            onClick={() => setVersionConfirm(quotation)}
            aria-label={t('actions.createNewVersion')}
            title={t('actions.createNewVersion')}
          >
            <ActionIcon name="document-duplicate" className="h-4 w-4" />
          </IconButton>
        )}
      </>
    ),
    [navigate, pdfMutation, t]
  );

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title={t('title')} description={t('description')} />
        {/*<PageHeader.Actions>*/}
        {/*  <Button onClick={() => navigate('/quotations/create')}>*/}
        {/*    <Icon name="plus" className="h-5 w-5" />*/}
        {/*    {t('list.new')}*/}
        {/*  </Button>*/}
        {/*</PageHeader.Actions>*/}
      </PageHeader>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchBar
          value={searchInput}
          onValueChange={handleSearchChange}
          onClear={handleClearSearch}
          placeholder={t('list.searchPlaceholder')}
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
        />
        <FilterBar>
          <FilterBar.Select
            options={STATUS_OPTIONS}
            value={statusFilter || ''}
            onValueChange={handleStatusFilterChange}
            placeholder={t('list.allStatuses')}
          />
        </FilterBar>
        <Button variant="secondary" onClick={handleSearchSubmit}>
          {tCommon('buttons.search')}
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
        <div className="text-center py-8 text-steel-400">{t('list.loading')}</div>
      ) : (
        <>
          {/* Quotations Table */}
          <QuotationTable
            quotations={data?.data ?? []}
            onRowClick={quotation => navigate(`/quotations/${quotation.id}`)}
            renderActions={renderActions}
            emptyMessage={statusFilter ? t('list.emptyFiltered') : t('list.empty')}
          />

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalItems={data.pagination.totalElements}
                itemsPerPage={data.pagination.size}
                onPageChange={setPage}
                isFirst={data.pagination.first}
                isLast={data.pagination.last}
                itemLabel="quotations"
              />
            </div>
          )}
        </>
      )}

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!submitConfirm}
        title={t('approval.submitTitle')}
        message={t('approval.submitMessage', { jobCode: submitConfirm?.jobCode })}
        confirmLabel={tCommon('buttons.submit')}
        onConfirm={() => {
          if (submitConfirm) submitMutation.mutate(submitConfirm.id);
        }}
        onClose={() => setSubmitConfirm(null)}
        variant="warning"
      />

      {/* Create Version Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!versionConfirm}
        title={t('version.createTitle')}
        message={t('version.createMessage', {
          jobCode: versionConfirm?.jobCode,
          version: versionConfirm?.version,
        })}
        confirmLabel={t('version.create')}
        onConfirm={() => {
          if (versionConfirm) versionMutation.mutate(versionConfirm.id);
        }}
        onClose={() => setVersionConfirm(null)}
        variant="warning"
      />

      {/* Send Email Confirmation Modal */}
      <EmailNotificationModal
        isOpen={!!emailConfirm}
        onClose={() => setEmailConfirm(null)}
        onSend={(to, ccEmails) => {
          if (emailConfirm) {
            notifyMutation.mutate({
              quotationId: emailConfirm.id,
              to,
              ccEmails,
            });
          }
        }}
        quotationInfo={
          emailConfirm
            ? { jobCode: emailConfirm.jobCode, version: emailConfirm.version }
            : undefined
        }
        isLoading={notifyMutation.isPending}
      />
    </div>
  );
}
