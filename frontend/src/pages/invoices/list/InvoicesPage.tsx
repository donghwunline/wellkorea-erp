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

import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, FilterBar, PageHeader, Button, Icon, Alert, Pagination } from '@/shared/ui';
import {
  type InvoiceSummary,
  type InvoiceStatus,
  InvoiceTable,
  invoiceQueries,
  invoiceStatusConfig,
} from '@/entities/invoice';
import { useAuth } from '@/entities/auth';

// Status filter options
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Statuses' },
  ...Object.entries(invoiceStatusConfig).map(([status, config]) => ({
    value: status,
    label: config.labelKo,
  })),
];

const PAGE_SIZE = 20;

export function InvoicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasAnyRole } = useAuth();

  // Get filter from URL params
  const statusFromUrl = searchParams.get('status') as InvoiceStatus | null;
  const pageFromUrl = parseInt(searchParams.get('page') || '0', 10);

  // Local state for filters
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | null>(statusFromUrl);
  const [page, setPage] = useState(pageFromUrl);

  // Check permissions
  const canCreate = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

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
  const handleCreate = useCallback(() => {
    navigate('/invoices/create');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title="세금계산서 관리" description="View and manage tax invoices" />
        <PageHeader.Actions>
          {canCreate && (
            <Button onClick={handleCreate}>
              <Icon name="plus" className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          )}
        </PageHeader.Actions>
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

      {/* Error State */}
      {fetchError && (
        <Alert variant="error" className="mb-6">
          Failed to load invoices: {fetchError.message}
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
              ? `No invoices found with status "${invoiceStatusConfig[statusFilter].labelKo}".`
              : 'No invoices found.'
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
              itemLabel="invoices"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
