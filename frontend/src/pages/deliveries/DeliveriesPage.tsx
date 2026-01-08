/**
 * Deliveries List Page
 *
 * Displays all deliveries with optional filtering.
 * Allows navigation to delivery details and creation.
 *
 * Route: /deliveries
 *
 * FSD Architecture:
 * - Page layer: URL params + layout assembly
 * - Uses entities/delivery for query hooks and UI
 */

import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, FilterBar, PageHeader, Button, Icon, Alert } from '@/shared/ui';
import {
  type Delivery,
  type DeliveryStatus,
  DeliveryTable,
  deliveryQueries,
  DELIVERY_STATUSES,
  DELIVERY_STATUS_CONFIG,
  downloadDeliveryStatement,
} from '@/entities/delivery';

// Status filter options
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...DELIVERY_STATUSES.map(status => ({
    value: status,
    label: DELIVERY_STATUS_CONFIG[status].labelKo,
  })),
];

export function DeliveriesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filter from URL params
  const statusFromUrl = searchParams.get('status') as DeliveryStatus | null;

  // Local state for filters
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | null>(statusFromUrl);

  // Track download state per delivery
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Server state via TanStack Query
  const {
    data: deliveries = [],
    isLoading,
    error: fetchError,
  } = useQuery(
    deliveryQueries.list({
      status: statusFilter ?? undefined,
    })
  );

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      const newStatus = value ? (value as DeliveryStatus) : null;
      setStatusFilter(newStatus);

      // Update URL params
      if (newStatus) {
        setSearchParams({ status: newStatus });
      } else {
        setSearchParams({});
      }
    },
    [setSearchParams]
  );

  // Handle row click - navigate to detail
  const handleRowClick = useCallback(
    (delivery: Delivery) => {
      navigate(`/deliveries/${delivery.id}`);
    },
    [navigate]
  );

  // Handle PDF download
  const handleDownloadStatement = useCallback(async (deliveryId: number) => {
    setDownloadingId(deliveryId);
    try {
      await downloadDeliveryStatement(deliveryId);
    } catch (error) {
      console.error('Failed to download statement:', error);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  // Render PDF download action
  const renderActions = useCallback(
    (delivery: Delivery) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDownloadStatement(delivery.id)}
        disabled={downloadingId === delivery.id}
        title="Download Statement"
      >
        {downloadingId === delivery.id ? (
          <Icon name="arrow-path" className="h-4 w-4 animate-spin" />
        ) : (
          <Icon name="document-arrow-down" className="h-4 w-4" />
        )}
      </Button>
    ),
    [downloadingId, handleDownloadStatement]
  );

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title="출고 관리" description="View and manage delivery records" />
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
          Failed to load deliveries: {fetchError.message}
        </Alert>
      )}

      {/* Deliveries Table */}
      <Card>
        <DeliveryTable
          deliveries={deliveries}
          loading={isLoading}
          onRowClick={handleRowClick}
          renderActions={renderActions}
          emptyMessage={
            statusFilter
              ? `No deliveries found with status "${DELIVERY_STATUS_CONFIG[statusFilter].labelKo}".`
              : 'No deliveries found.'
          }
        />
      </Card>
    </div>
  );
}
