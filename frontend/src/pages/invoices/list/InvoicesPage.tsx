/**
 * Invoices List Page
 *
 * Displays all invoices with pagination and optional filtering.
 * Allows navigation to invoice details and creation.
 *
 * Route: /invoices
 *
 * FSD Architecture:
 * - Page layer: URL params + layout assembly
 * - Uses entities/invoice for query hooks and UI
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Card, FilterBar, PageHeader, Pagination } from '@/shared/ui';
import {
  invoiceQueries,
  type InvoiceStatus,
  invoiceStatusConfig,
  type InvoiceSummary,
  InvoiceTable,
} from '@/entities/invoice';
// import { useAuth } from '@/entities/auth';

const PAGE_SIZE = 20;

export function InvoicesPage() {
  const { t } = useTranslation('invoices');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // const { hasAnyRole } = useAuth();

  // Status filter options using i18n
  const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: '', label: t('list.allStatuses') },
    ...Object.keys(invoiceStatusConfig).map(status => ({
      value: status,
      label: t(`status.${status}`),
    })),
  ];

  // Get filter from URL params
  const statusFromUrl = searchParams.get('status') as InvoiceStatus | null;
  const pageFromUrl = parseInt(searchParams.get('page') || '0', 10);

  // Local state for filters
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | null>(statusFromUrl);
  const [page, setPage] = useState(pageFromUrl);

  // Check permissions
  // const canCreate = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Server state via TanStack Query
  const {
    data: invoicePage,
    isLoading,
    error: fetchError,
  } = useQuery(
    invoiceQueries.list({
      page,
      size: PAGE_SIZE,
      sort: 'issueDate,desc',
    })
  );

  const invoices = invoicePage?.data ?? [];
  const pagination = invoicePage?.pagination;

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      const newStatus = value ? (value as InvoiceStatus) : null;
      setStatusFilter(newStatus);
      setPage(0);

      // Update URL params
      const params = new URLSearchParams();
      if (newStatus) params.set('status', newStatus);
      setSearchParams(params);
    },
    [setSearchParams]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  // Handle row click - navigate to detail
  const handleRowClick = useCallback(
    (invoice: InvoiceSummary) => {
      navigate(`/invoices/${invoice.id}`);
    },
    [navigate]
  );

  // Handle create button
  // const handleCreate = useCallback(() => {
  //   navigate('/invoices/create');
  // }, [navigate]);

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title={t('title')} description={t('description')} />
        {/*<PageHeader.Actions>*/}
        {/*  {canCreate && (*/}
        {/*    <Button onClick={handleCreate}>*/}
        {/*      <Icon name="plus" className="h-4 w-4 mr-2" />*/}
        {/*      {t('list.new')}*/}
        {/*    </Button>*/}
        {/*  )}*/}
        {/*</PageHeader.Actions>*/}
      </PageHeader>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        <FilterBar>
          <FilterBar.Field label={t('fields.status')}>
            <FilterBar.Select
              options={STATUS_OPTIONS}
              value={statusFilter || ''}
              onValueChange={handleStatusFilterChange}
              placeholder={t('list.allStatuses')}
            />
          </FilterBar.Field>
        </FilterBar>
      </div>

      {/* Error State */}
      {fetchError && (
        <Alert variant="error" className="mb-6">
          {t('list.loadError')}: {fetchError.message}
        </Alert>
      )}

      {/* Invoices Table */}
      <Card>
        <InvoiceTable
          invoices={invoices}
          loading={isLoading}
          onRowClick={handleRowClick}
          emptyMessage={
            statusFilter
              ? t('list.emptyFiltered', { status: t(`status.${statusFilter}`) })
              : t('list.empty')
          }
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-steel-700 p-4">
            <Pagination
              currentPage={page}
              totalItems={pagination.totalElements}
              itemsPerPage={PAGE_SIZE}
              onPageChange={handlePageChange}
              isFirst={pagination.first}
              isLast={pagination.last}
              itemLabel={t('title').toLowerCase()}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
