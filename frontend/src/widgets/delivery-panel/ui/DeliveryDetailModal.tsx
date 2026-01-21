/**
 * Delivery Detail Modal
 *
 * Displays delivery details in a modal to preserve user context.
 * Supports inline actions: Mark Delivered, Mark Returned, Download PDF.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Icon,
  LoadingState,
  Modal,
  ModalActions,
  Table,
} from '@/shared/ui';
import {
  deliveryQueries,
  DeliveryStatusBadge,
  deliveryRules,
  downloadDeliveryStatement,
} from '@/entities/delivery';
import { useAuth } from '@/entities/auth';
import { useMarkDelivered } from '@/features/delivery/mark-delivered';
import { useMarkReturned } from '@/features/delivery/mark-returned';
import { useReassignDelivery } from '@/features/delivery/reassign';
import { formatDate, formatDateTime } from '@/shared/lib/formatting';

export interface DeliveryDetailModalProps {
  /** Delivery ID to display */
  readonly deliveryId: number;
  /** Whether modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Optional callback after successful status change */
  readonly onSuccess?: () => void;
  /** Latest accepted quotation ID for outdated detection */
  readonly latestAcceptedQuotationId?: number | null;
}

export function DeliveryDetailModal({
  deliveryId,
  isOpen,
  onClose,
  onSuccess,
  latestAcceptedQuotationId,
}: DeliveryDetailModalProps) {
  const { t } = useTranslation('widgets');
  const { hasAnyRole } = useAuth();
  const canManageDeliveries = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Fetch delivery details
  const {
    data: delivery,
    isLoading,
    error: fetchError,
  } = useQuery({
    ...deliveryQueries.detail(deliveryId),
    enabled: isOpen && deliveryId > 0,
  });

  // Success message state with auto-dismiss
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const showSuccess = useCallback((message: string) => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    setSuccessMessage(message);
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
      successTimeoutRef.current = null;
    }, 3000);
  }, []);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);

  // Mutation hooks
  const { mutate: markDelivered, isPending: isMarkingDelivered } = useMarkDelivered({
    onSuccess: () => {
      showSuccess(t('deliveryDetailModal.successMessages.delivered'));
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const { mutate: markReturned, isPending: isMarkingReturned } = useMarkReturned({
    onSuccess: () => {
      showSuccess(t('deliveryDetailModal.successMessages.returned'));
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const { mutate: reassignDelivery, isPending: isReassigning } = useReassignDelivery({
    onSuccess: () => {
      showSuccess(t('deliveryDetailModal.successMessages.reassigned'));
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Handlers
  const handleClose = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
    onClose();
  }, [onClose]);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    setError(null);
    try {
      await downloadDeliveryStatement(deliveryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deliveryDetailModal.loadError', { message: 'Unknown error' }));
    } finally {
      setIsDownloading(false);
    }
  }, [deliveryId]);

  const handleMarkDelivered = useCallback(() => {
    setError(null);
    markDelivered(deliveryId);
  }, [deliveryId, markDelivered]);

  const handleMarkReturned = useCallback(() => {
    setError(null);
    markReturned(deliveryId);
  }, [deliveryId, markReturned]);

  const handleReassign = useCallback(() => {
    if (latestAcceptedQuotationId) {
      setError(null);
      reassignDelivery({ deliveryId, quotationId: latestAcceptedQuotationId });
    }
  }, [deliveryId, latestAcceptedQuotationId, reassignDelivery]);

  // Check action permissions
  const canMarkDelivered = delivery && canManageDeliveries && deliveryRules.canMarkDelivered(delivery);
  const canMarkReturned = delivery && canManageDeliveries && deliveryRules.canMarkReturned(delivery);
  const isActing = isMarkingDelivered || isMarkingReturned || isReassigning;

  // Check outdated status
  const isOutdated = delivery && deliveryRules.isOutdated(delivery, latestAcceptedQuotationId ?? null);
  const canReassign = delivery && canManageDeliveries && isOutdated && deliveryRules.canReassign(delivery);

  // Calculate total quantity
  const totalQuantity = delivery ? deliveryRules.getTotalQuantity(delivery) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={delivery ? t('deliveryDetailModal.titleWithId', { id: delivery.id }) : t('deliveryDetailModal.loading')}
      size="lg"
    >
      {/* Loading State */}
      {isLoading && (
        <div className="py-12">
          <LoadingState message={t('deliveryDetailModal.loading')} />
        </div>
      )}

      {/* Fetch Error */}
      {fetchError && !isLoading && (
        <Alert variant="error">
          {t('deliveryDetailModal.loadError', { message: fetchError.message })}
        </Alert>
      )}

      {/* Content */}
      {delivery && !isLoading && (
        <div className="space-y-6">
          {/* Outdated Warning Alert */}
          {isOutdated && (
            <Alert variant="warning">
              <div className="flex items-center justify-between">
                <div>
                  <strong>{t('deliveryDetailModal.outdatedWarning.title')}</strong>
                  <p className="mt-1 text-sm">
                    {t('deliveryDetailModal.outdatedWarning.description')}
                  </p>
                </div>
              </div>
            </Alert>
          )}

          {/* Success/Error Alerts */}
          {successMessage && (
            <Alert variant="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Delivery Info Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm text-steel-400">{t('deliveryDetailModal.fields.status')}</div>
              <div className="mt-1">
                <DeliveryStatusBadge status={delivery.status} isOutdated={isOutdated} />
              </div>
            </div>
            <div>
              <div className="text-sm text-steel-400">{t('deliveryDetailModal.fields.deliveryDate')}</div>
              <div className="mt-1 text-white">{formatDate(delivery.deliveryDate)}</div>
            </div>
            <div>
              <div className="text-sm text-steel-400">{t('deliveryDetailModal.fields.deliveredBy')}</div>
              <div className="mt-1 text-white">{delivery.deliveredByName}</div>
            </div>
            <div>
              <div className="text-sm text-steel-400">{t('deliveryDetailModal.fields.project')}</div>
              <div className="mt-1">
                <Link
                  to={`/projects/${delivery.projectId}`}
                  className="text-copper-400 hover:underline"
                  onClick={handleClose}
                >
                  {delivery.jobCode || `Project #${delivery.projectId}`}
                </Link>
              </div>
            </div>
          </div>

          {/* Notes */}
          {delivery.notes && (
            <div className="border-t border-steel-700 pt-4">
              <div className="text-sm text-steel-400">{t('deliveryDetailModal.fields.notes')}</div>
              <div className="mt-1 text-steel-300">{delivery.notes}</div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-steel-700 pt-4 text-xs text-steel-500">
            {t('deliveryDetailModal.metadata', {
              createdAt: formatDateTime(delivery.createdAt),
              updatedAt: formatDateTime(delivery.updatedAt),
            })}
          </div>

          {/* Line Items Table */}
          <div className="border-t border-steel-700 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{t('deliveryDetailModal.sections.deliveredItems')}</h3>
              <span className="text-sm text-steel-400">
                {t('deliveryDetailModal.sections.itemCount', {
                  items: delivery.lineItems.length,
                  units: totalQuantity,
                })}
              </span>
            </div>

            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t('deliveryDetailModal.table.product')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('deliveryDetailModal.table.sku')}</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">{t('deliveryDetailModal.table.quantity')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {delivery.lineItems.map(item => (
                  <Table.Row key={item.id}>
                    <Table.Cell className="font-medium text-white">
                      {item.productName}
                    </Table.Cell>
                    <Table.Cell className="text-steel-400">
                      {item.productSku || '-'}
                    </Table.Cell>
                    <Table.Cell className="text-right font-medium text-copper-400">
                      {item.quantityDelivered}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
              <tfoot>
                <tr className="border-t border-steel-700">
                  <td colSpan={2} className="px-4 py-3 text-right font-medium text-white">
                    {t('deliveryDetailModal.table.total')}:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-copper-400">
                    {totalQuantity}
                  </td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </div>
      )}

      {/* Modal Actions */}
      {delivery && !isLoading && (
        <ModalActions align="between">
          <Button variant="ghost" onClick={handleClose}>
            {t('deliveryDetailModal.actions.close')}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Icon name="arrow-path" className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon name="document-arrow-down" className="mr-2 h-4 w-4" />
              )}
              {t('deliveryDetailModal.actions.download')}
            </Button>
            {canMarkDelivered && (
              <Button
                variant="primary"
                onClick={handleMarkDelivered}
                disabled={isActing}
              >
                {isMarkingDelivered && (
                  <Icon name="arrow-path" className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('deliveryDetailModal.actions.markDelivered')}
              </Button>
            )}
            {canMarkReturned && (
              <Button
                variant="warning"
                onClick={handleMarkReturned}
                disabled={isActing}
              >
                {isMarkingReturned && (
                  <Icon name="arrow-path" className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('deliveryDetailModal.actions.markReturned')}
              </Button>
            )}
            {canReassign && (
              <Button
                variant="secondary"
                onClick={handleReassign}
                disabled={isActing}
              >
                {isReassigning ? (
                  <Icon name="arrow-path" className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icon name="forward" className="mr-2 h-4 w-4" />
                )}
                {t('deliveryDetailModal.actions.reassignToLatest')}
              </Button>
            )}
          </div>
        </ModalActions>
      )}
    </Modal>
  );
}
