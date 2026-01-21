/**
 * Delivery Panel Widget
 *
 * Displays delivery information for a project including:
 * - Delivery summary stats
 * - List of deliveries with status
 * - Detail modal for viewing delivery details inline
 * - Link to create new delivery
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Icon, LoadingState, Table } from '@/shared/ui';
import {
  type Delivery,
  deliveryQueries,
  deliveryRules,
  DeliveryStatusBadge,
  downloadDeliveryStatement,
} from '@/entities/delivery';
import { quotationQueries, QuotationStatus } from '@/entities/quotation';
import { useAuth } from '@/entities/auth';
import { formatDate } from '@/shared/lib/formatting';
import { DeliveryCreateModal } from './ui/DeliveryCreateModal';
import { DeliveryDetailModal } from './ui/DeliveryDetailModal';
import { DeliverySummaryStats } from './ui/DeliverySummaryStats';

export interface DeliveryPanelProps {
  readonly projectId: number;
}

export function DeliveryPanel({ projectId }: DeliveryPanelProps) {
  const { t } = useTranslation('widgets');
  const { hasAnyRole } = useAuth();

  // Check if user can create deliveries (Finance/Admin)
  const canCreateDelivery = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Fetch deliveries for this project
  const {
    data: deliveries = [],
    isLoading: loadingDeliveries,
    error: deliveriesError,
  } = useQuery(deliveryQueries.list({ projectId }));

  // Fetch accepted quotation to check if deliveries can be created
  const { data: quotationsData, isLoading: loadingQuotations } = useQuery(
    quotationQueries.list({
      page: 0,
      size: 1,
      search: '',
      status: QuotationStatus.ACCEPTED,
      projectId,
    })
  );

  const hasAcceptedQuotation = useMemo(() => {
    return quotationsData && quotationsData.data.length > 0;
  }, [quotationsData]);

  // Get the latest accepted quotation ID for outdated detection
  const latestAcceptedQuotationId = useMemo(() => {
    if (quotationsData && quotationsData.data.length > 0) {
      return quotationsData.data[0].id;
    }
    return null;
  }, [quotationsData]);

  // Modal states
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Track download state
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Handle download statement
  const handleDownloadStatement = useCallback(async (deliveryId: number) => {
    setDownloadingId(deliveryId);
    try {
      await downloadDeliveryStatement(deliveryId);
    } catch (error) {
      // Error handling could be enhanced with toast notifications
      console.error('Failed to download statement:', error);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const isLoading = loadingDeliveries || loadingQuotations;

  if (isLoading) {
    return (
      <Card>
        <LoadingState message={t('deliveryPanel.loading')} />
      </Card>
    );
  }

  if (deliveriesError) {
    return <Alert variant="error">{t('deliveryPanel.loadError', { message: deliveriesError.message })}</Alert>;
  }

  // Empty state - no accepted quotation
  if (!hasAcceptedQuotation) {
    return (
      <Card className="p-12 text-center">
        <Icon name="document" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
        <h3 className="text-lg font-semibold text-white">{t('deliveryPanel.noQuotation')}</h3>
        <p className="mt-2 text-steel-500">
          {t('deliveryPanel.noQuotationDesc')}
        </p>
      </Card>
    );
  }

  // Empty state - no deliveries yet
  if (deliveries.length === 0) {
    return (
      <>
        <Card className="p-12 text-center">
          <Icon name="truck" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
          <h3 className="text-lg font-semibold text-white">{t('deliveryPanel.noDeliveries')}</h3>
          <p className="mt-2 text-steel-500">{t('deliveryPanel.noDeliveriesDesc')}</p>
          {canCreateDelivery && (
            <Button
              variant="primary"
              className="mt-6"
              onClick={() => setShowCreateModal(true)}
            >
              <Icon name="plus" className="h-4 w-4" />
              {t('deliveryPanel.recordDelivery')}
            </Button>
          )}
        </Card>

        {/* Create Modal - rendered outside Card for proper portal behavior */}
        <DeliveryCreateModal
          projectId={projectId}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            // Query invalidation handled by mutation hook
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <DeliverySummaryStats deliveries={deliveries} />

      {/* Actions */}
      {canCreateDelivery && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Icon name="plus" className="h-4 w-4" />
            {t('deliveryPanel.recordDelivery')}
          </Button>
        </div>
      )}

      {/* Deliveries Table */}
      <Card className="overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t('deliveryPanel.table.id')}</Table.HeaderCell>
              <Table.HeaderCell>{t('deliveryPanel.table.deliveryDate')}</Table.HeaderCell>
              <Table.HeaderCell>{t('deliveryPanel.table.deliveredBy')}</Table.HeaderCell>
              <Table.HeaderCell>{t('deliveryPanel.table.items')}</Table.HeaderCell>
              <Table.HeaderCell>{t('deliveryPanel.table.status')}</Table.HeaderCell>
              <Table.HeaderCell className="text-right">{t('deliveryPanel.table.actions')}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {deliveries.map((delivery: Delivery) => (
              <Table.Row
                key={delivery.id}
                onClick={() => setSelectedDeliveryId(delivery.id)}
                className="cursor-pointer transition-colors hover:bg-steel-800/50"
              >
                <Table.Cell>
                  <span className="font-medium text-copper-400">#{delivery.id}</span>
                </Table.Cell>
                <Table.Cell className="text-steel-300">
                  {formatDate(delivery.deliveryDate)}
                </Table.Cell>
                <Table.Cell className="text-steel-300">{delivery.deliveredByName}</Table.Cell>
                <Table.Cell className="text-steel-300">
                  {t('deliveryPanel.table.itemCount', { count: delivery.lineItems.length, units: deliveryRules.getTotalQuantity(delivery) })}
                </Table.Cell>
                <Table.Cell>
                  <DeliveryStatusBadge
                    status={delivery.status}
                    isOutdated={deliveryRules.isOutdated(delivery, latestAcceptedQuotationId)}
                  />
                </Table.Cell>
                <Table.Cell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleDownloadStatement(delivery.id);
                      }}
                      disabled={downloadingId === delivery.id}
                      title={t('deliveryPanel.actions.downloadStatement')}
                    >
                      {downloadingId === delivery.id ? (
                        <Icon name="arrow-path" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon name="document-arrow-down" className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedDeliveryId(delivery.id);
                      }}
                      title={t('deliveryPanel.actions.viewDetails')}
                    >
                      <Icon name="eye" className="h-4 w-4" />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>

      {/* Delivery Detail Modal */}
      {selectedDeliveryId !== null && (
        <DeliveryDetailModal
          deliveryId={selectedDeliveryId}
          isOpen={true}
          onClose={() => setSelectedDeliveryId(null)}
          onSuccess={() => {
            // Refetch deliveries when status changes
            // Query invalidation is handled by the mutation hooks
          }}
          latestAcceptedQuotationId={latestAcceptedQuotationId}
        />
      )}

      {/* Delivery Create Modal */}
      <DeliveryCreateModal
        projectId={projectId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          // Query invalidation handled by mutation hook
        }}
      />
    </div>
  );
}
