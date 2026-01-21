/**
 * Purchase Order Detail Modal.
 *
 * Displays full purchase order details with timeline visualization
 * and workflow actions (Send, Confirm, Receive, Cancel).
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  ConfirmationModal,
  EmailSendModal,
  Icon,
  LoadingState,
  Modal,
  ModalActions,
} from '@/shared/ui';
import {
  purchaseOrderQueries,
  purchaseOrderRules,
  PurchaseOrderStatusBadge,
  PurchaseOrderTimeline,
} from '@/entities/purchase-order';
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/formatting';
import { useSendPurchaseOrder } from '@/features/purchase-order/send';
import { useConfirmPurchaseOrder } from '@/features/purchase-order/confirm';
import { useReceivePurchaseOrder } from '@/features/purchase-order/receive';
import { useCancelPurchaseOrder } from '@/features/purchase-order/cancel';

export interface PurchaseOrderDetailModalProps {
  /** Purchase Order ID to display */
  readonly purchaseOrderId: number;
  /** Whether modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Optional callback after successful action */
  readonly onSuccess?: () => void;
}

/**
 * Info field display component.
 */
function InfoField({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm text-steel-400">{label}</div>
      <div className="mt-1 text-white">{children}</div>
    </div>
  );
}

export function PurchaseOrderDetailModal({
  purchaseOrderId,
  isOpen,
  onClose,
  onSuccess,
}: PurchaseOrderDetailModalProps) {
  const { t } = useTranslation('widgets');

  // Success message with auto-dismiss
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Confirmation modal states
  const [sendConfirm, setSendConfirm] = useState(false);
  const [confirmConfirm, setConfirmConfirm] = useState(false);
  const [receiveConfirm, setReceiveConfirm] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

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

  // Fetch purchase order details
  const {
    data: purchaseOrder,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery({
    ...purchaseOrderQueries.detail(purchaseOrderId),
    enabled: isOpen && purchaseOrderId > 0,
  });

  // Mutation hooks
  const { mutate: sendOrder, isPending: isSending } = useSendPurchaseOrder({
    onSuccess: () => {
      showSuccess(t('purchaseOrderDetailModal.successMessages.sent'));
      setSendConfirm(false);
      refetch();
      onSuccess?.();
    },
    onError: err => setError(err.message),
  });

  const { mutate: confirmOrder, isPending: isConfirming } = useConfirmPurchaseOrder({
    onSuccess: () => {
      showSuccess(t('purchaseOrderDetailModal.successMessages.confirmed'));
      setConfirmConfirm(false);
      refetch();
      onSuccess?.();
    },
    onError: err => setError(err.message),
  });

  const { mutate: receiveOrder, isPending: isReceiving } = useReceivePurchaseOrder({
    onSuccess: () => {
      showSuccess(t('purchaseOrderDetailModal.successMessages.received'));
      setReceiveConfirm(false);
      refetch();
      onSuccess?.();
    },
    onError: err => setError(err.message),
  });

  const { mutate: cancelOrder, isPending: isCanceling } = useCancelPurchaseOrder({
    onSuccess: () => {
      showSuccess(t('purchaseOrderDetailModal.successMessages.canceled'));
      setCancelConfirm(false);
      refetch();
      onSuccess?.();
    },
    onError: err => setError(err.message),
  });

  const isActing = isSending || isConfirming || isReceiving || isCanceling;

  // Handlers
  const handleSend = useCallback(
    (to: string, ccEmails: string[]) => {
      sendOrder({
        purchaseOrderId,
        to,
        ccEmails,
      });
    },
    [purchaseOrderId, sendOrder]
  );

  const handleConfirm = useCallback(() => {
    confirmOrder(purchaseOrderId);
  }, [purchaseOrderId, confirmOrder]);

  const handleReceive = useCallback(() => {
    receiveOrder(purchaseOrderId);
  }, [purchaseOrderId, receiveOrder]);

  const handleCancel = useCallback(() => {
    cancelOrder(purchaseOrderId);
  }, [purchaseOrderId, cancelOrder]);

  // Loading state
  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('purchaseOrderDetailModal.title')} size="lg">
        <LoadingState message={t('purchaseOrderDetailModal.loading')} />
      </Modal>
    );
  }

  // Error state
  if (fetchError || !purchaseOrder) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('purchaseOrderDetailModal.title')} size="lg">
        <Alert variant="error">{fetchError?.message || t('purchaseOrderDetailModal.loadError')}</Alert>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            {t('purchaseOrderDetailModal.close')}
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  // Business rules
  const canSend = purchaseOrderRules.canSend(purchaseOrder);
  const canConfirmOrder = purchaseOrderRules.canConfirm(purchaseOrder);
  const canReceiveOrder = purchaseOrderRules.canReceive(purchaseOrder);
  const canCancelOrder = purchaseOrderRules.canCancel(purchaseOrder);
  const isOverdue = purchaseOrderRules.isOverdue(purchaseOrder);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('purchaseOrderDetailModal.titleWithNumber', { poNumber: purchaseOrder.poNumber })}
        size="lg"
      >
        {/* Success Message */}
        {successMessage && (
          <Alert variant="success" className="mb-4" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Timeline */}
            <Card className="p-4">
              <PurchaseOrderTimeline status={purchaseOrder.status} />
            </Card>

            {/* PO Details */}
            <Card className="p-4">
              <h3 className="mb-4 text-lg font-medium text-white">{t('purchaseOrderDetailModal.sections.orderInfo')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label={t('purchaseOrderDetailModal.fields.poNumber')}>
                  <span className="font-mono font-medium text-copper-400">
                    {purchaseOrder.poNumber}
                  </span>
                </InfoField>
                <InfoField label={t('purchaseOrderDetailModal.fields.status')}>
                  <PurchaseOrderStatusBadge status={purchaseOrder.status} korean />
                </InfoField>
                <InfoField label={t('purchaseOrderDetailModal.fields.vendor')}>
                  <span className="font-medium">{purchaseOrder.vendorName}</span>
                </InfoField>
                <InfoField label={t('purchaseOrderDetailModal.fields.project')}>
                  <span className="text-steel-300">{purchaseOrder.jobCode}</span>
                </InfoField>
                <InfoField label={t('purchaseOrderDetailModal.fields.orderDate')}>{formatDate(purchaseOrder.orderDate)}</InfoField>
                <InfoField label={t('purchaseOrderDetailModal.fields.expectedDelivery')}>
                  <span className={isOverdue ? 'font-medium text-red-400' : ''}>
                    {formatDate(purchaseOrder.expectedDeliveryDate)}
                    {isOverdue && <span className="ml-2 text-xs">({t('purchaseOrderDetailModal.fields.overdue')})</span>}
                  </span>
                </InfoField>
                <InfoField label={t('purchaseOrderDetailModal.fields.totalAmount')}>
                  <span className="text-lg font-semibold text-copper-400">
                    {formatCurrency(purchaseOrder.totalAmount, {
                      currency: purchaseOrder.currency,
                    })}
                  </span>
                </InfoField>
                <InfoField label={t('purchaseOrderDetailModal.fields.currency')}>{purchaseOrder.currency}</InfoField>
              </div>
            </Card>

            {/* Notes */}
            {purchaseOrder.notes && (
              <Card className="p-4">
                <h3 className="mb-2 text-lg font-medium text-white">{t('purchaseOrderDetailModal.fields.notes')}</h3>
                <p className="text-steel-300">{purchaseOrder.notes}</p>
              </Card>
            )}

            {/* Metadata */}
            <div className="text-xs text-steel-500">
              {t('purchaseOrderDetailModal.metadata', {
                createdBy: purchaseOrder.createdByName,
                createdAt: formatDateTime(purchaseOrder.createdAt),
                updatedAt: formatDateTime(purchaseOrder.updatedAt),
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Info */}
            <Card className="p-4">
              <h3 className="mb-4 text-lg font-medium text-white">{t('purchaseOrderDetailModal.sections.related')}</h3>
              <div className="space-y-3">
                <InfoField label={t('purchaseOrderDetailModal.fields.purchaseRequest')}>
                  <div className="font-medium text-copper-400">
                    {purchaseOrder.purchaseRequestNumber}
                  </div>
                </InfoField>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4">
              <h3 className="mb-4 text-lg font-medium text-white">{t('purchaseOrderDetailModal.sections.actions')}</h3>
              <div className="space-y-2">
                {canSend && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => setSendConfirm(true)}
                    disabled={isActing}
                  >
                    <Icon name="paper-airplane" className="mr-2 h-4 w-4" />
                    {t('purchaseOrderDetailModal.actions.sendToVendor')}
                  </Button>
                )}

                {canConfirmOrder && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => setConfirmConfirm(true)}
                    disabled={isActing}
                  >
                    <Icon name="check-circle" className="mr-2 h-4 w-4" />
                    {t('purchaseOrderDetailModal.actions.confirmOrder')}
                  </Button>
                )}

                {canReceiveOrder && (
                  <Button
                    variant="primary"
                    className="w-full justify-start"
                    onClick={() => setReceiveConfirm(true)}
                    disabled={isActing}
                  >
                    <Icon name="truck" className="mr-2 h-4 w-4" />
                    {t('purchaseOrderDetailModal.actions.markReceived')}
                  </Button>
                )}

                {canCancelOrder && (
                  <Button
                    variant="danger"
                    className="w-full justify-start"
                    onClick={() => setCancelConfirm(true)}
                    disabled={isActing}
                  >
                    <Icon name="x-mark" className="mr-2 h-4 w-4" />
                    {t('purchaseOrderDetailModal.actions.cancelOrder')}
                  </Button>
                )}

                {/* No actions available message */}
                {!canSend && !canConfirmOrder && !canReceiveOrder && !canCancelOrder && (
                  <p className="text-sm text-steel-400">{t('purchaseOrderDetailModal.actions.noActions')}</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            {t('purchaseOrderDetailModal.close')}
          </Button>
        </ModalActions>
      </Modal>

      {/* Send Purchase Order Email */}
      <EmailSendModal
        isOpen={sendConfirm}
        onClose={() => setSendConfirm(false)}
        onSend={handleSend}
        defaultEmail={purchaseOrder.vendorEmail ?? undefined}
        title={t('purchaseOrderDetailModal.confirmSend.title')}
        contextMessage={t('purchaseOrderDetailModal.confirmSend.message', { poNumber: purchaseOrder.poNumber, vendorName: purchaseOrder.vendorName })}
        helpText={t('purchaseOrderDetailModal.confirmSend.helpText')}
        isLoading={isSending}
      />

      {/* Confirm Confirmation */}
      <ConfirmationModal
        isOpen={confirmConfirm}
        title={t('purchaseOrderDetailModal.confirmConfirm.title')}
        message={t('purchaseOrderDetailModal.confirmConfirm.message', { poNumber: purchaseOrder.poNumber })}
        confirmLabel={t('purchaseOrderDetailModal.confirmConfirm.confirm')}
        onConfirm={handleConfirm}
        onClose={() => setConfirmConfirm(false)}
      />

      {/* Receive Confirmation */}
      <ConfirmationModal
        isOpen={receiveConfirm}
        title={t('purchaseOrderDetailModal.confirmReceive.title')}
        message={t('purchaseOrderDetailModal.confirmReceive.message', { poNumber: purchaseOrder.poNumber })}
        confirmLabel={t('purchaseOrderDetailModal.confirmReceive.confirm')}
        variant="warning"
        onConfirm={handleReceive}
        onClose={() => setReceiveConfirm(false)}
      />

      {/* Cancel Confirmation */}
      <ConfirmationModal
        isOpen={cancelConfirm}
        title={t('purchaseOrderDetailModal.confirmCancel.title')}
        message={t('purchaseOrderDetailModal.confirmCancel.message', { poNumber: purchaseOrder.poNumber })}
        confirmLabel={t('purchaseOrderDetailModal.confirmCancel.confirm')}
        variant="danger"
        onConfirm={handleCancel}
        onClose={() => setCancelConfirm(false)}
      />
    </>
  );
}
