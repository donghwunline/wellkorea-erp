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
  /** Latest approved quotation ID for outdated detection */
  readonly latestApprovedQuotationId?: number | null;
}

export function DeliveryDetailModal({
  deliveryId,
  isOpen,
  onClose,
  onSuccess,
  latestApprovedQuotationId,
}: DeliveryDetailModalProps) {
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
      showSuccess('Delivery marked as delivered');
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const { mutate: markReturned, isPending: isMarkingReturned } = useMarkReturned({
    onSuccess: () => {
      showSuccess('Delivery marked as returned');
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const { mutate: reassignDelivery, isPending: isReassigning } = useReassignDelivery({
    onSuccess: () => {
      showSuccess('Delivery reassigned to latest quotation');
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
      setError(err instanceof Error ? err.message : 'Failed to download statement');
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
    if (latestApprovedQuotationId) {
      setError(null);
      reassignDelivery({ deliveryId, quotationId: latestApprovedQuotationId });
    }
  }, [deliveryId, latestApprovedQuotationId, reassignDelivery]);

  // Check action permissions
  const canMarkDelivered = delivery && canManageDeliveries && deliveryRules.canMarkDelivered(delivery);
  const canMarkReturned = delivery && canManageDeliveries && deliveryRules.canMarkReturned(delivery);
  const isActing = isMarkingDelivered || isMarkingReturned || isReassigning;

  // Check outdated status
  const isOutdated = delivery && deliveryRules.isOutdated(delivery, latestApprovedQuotationId ?? null);
  const canReassign = delivery && canManageDeliveries && isOutdated && deliveryRules.canReassign(delivery);

  // Calculate total quantity
  const totalQuantity = delivery ? deliveryRules.getTotalQuantity(delivery) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={delivery ? `출고 #${delivery.id}` : 'Loading...'}
      size="lg"
    >
      {/* Loading State */}
      {isLoading && (
        <div className="py-12">
          <LoadingState message="Loading delivery details..." />
        </div>
      )}

      {/* Fetch Error */}
      {fetchError && !isLoading && (
        <Alert variant="error">
          Failed to load delivery: {fetchError.message}
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
                  <strong>Outdated Quotation Reference</strong>
                  <p className="mt-1 text-sm">
                    This delivery references an older version of the quotation. Consider
                    reassigning it to the latest approved quotation to keep records consistent.
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
              <div className="text-sm text-steel-400">Status</div>
              <div className="mt-1">
                <DeliveryStatusBadge status={delivery.status} isOutdated={isOutdated} />
              </div>
            </div>
            <div>
              <div className="text-sm text-steel-400">Delivery Date</div>
              <div className="mt-1 text-white">{formatDate(delivery.deliveryDate)}</div>
            </div>
            <div>
              <div className="text-sm text-steel-400">Delivered By</div>
              <div className="mt-1 text-white">{delivery.deliveredByName}</div>
            </div>
            <div>
              <div className="text-sm text-steel-400">Project</div>
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
              <div className="text-sm text-steel-400">Notes</div>
              <div className="mt-1 text-steel-300">{delivery.notes}</div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-steel-700 pt-4 text-xs text-steel-500">
            Created: {formatDateTime(delivery.createdAt)} | Updated:{' '}
            {formatDateTime(delivery.updatedAt)}
          </div>

          {/* Line Items Table */}
          <div className="border-t border-steel-700 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Delivered Items</h3>
              <span className="text-sm text-steel-400">
                {delivery.lineItems.length} items, {totalQuantity} total units
              </span>
            </div>

            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Product</Table.HeaderCell>
                  <Table.HeaderCell>SKU</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Quantity</Table.HeaderCell>
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
                    Total:
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
            Close
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
              Download
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
                Mark Delivered
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
                Mark Returned
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
                Reassign to Latest
              </Button>
            )}
          </div>
        </ModalActions>
      )}
    </Modal>
  );
}
