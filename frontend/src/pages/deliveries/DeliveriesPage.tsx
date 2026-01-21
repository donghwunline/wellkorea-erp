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
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, FilterBar, PageHeader, Button, Icon, Alert } from '@/shared/ui';
import {
  type Delivery,
  type DeliveryStatus,
  DeliveryTable,
  deliveryQueries,
  DELIVERY_STATUSES,
  downloadDeliveryStatement,
} from '@/entities/delivery';

export function DeliveriesPage() {
  const { t } = useTranslation('deliveries');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Status filter options using i18n
  const STATUS_OPTIONS = [
    { value: '', label: t('list.allStatuses') },
    ...DELIVERY_STATUSES.map(status => ({
      value: status,
      label: t(`status.${status}`),
    })),
  ];

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
        title={t('actions.downloadStatement')}
      >
        {downloadingId === delivery.id ? (
          <Icon name="arrow-path" className="h-4 w-4 animate-spin" />
        ) : (
          <Icon name="document-arrow-down" className="h-4 w-4" />
        )}
      </Button>
    ),
    [downloadingId, handleDownloadStatement, t]
  );

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title={t('title')} description={t('description')} />
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

      {/* Deliveries Table */}
      <Card>
        <DeliveryTable
          deliveries={deliveries}
          loading={isLoading}
          onRowClick={handleRowClick}
          renderActions={renderActions}
          emptyMessage={
            statusFilter
              ? t('list.emptyFiltered', { status: t(`status.${statusFilter}`) })
              : t('list.empty')
          }
        />
      </Card>
    </div>
  );
}
