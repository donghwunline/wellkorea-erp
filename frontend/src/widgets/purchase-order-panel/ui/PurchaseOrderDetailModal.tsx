/**
 * Purchase Order Detail Modal.
 *
 * Displays full purchase order details with timeline visualization
 * and workflow actions (Send, Confirm, Receive, Cancel).
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  ConfirmationModal,
  Icon,
  LoadingState,
  Modal,
  ModalActions,
} from '@/shared/ui';
import {
  purchaseOrderQueries,
  purchaseOrderRules,
  PurchaseOrderTimeline,
  PurchaseOrderStatusBadge,
} from '@/entities/purchase-order';
import { formatDate, formatDateTime, formatCurrency } from '@/shared/lib/formatting';
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
      showSuccess('Purchase order sent to vendor');
      setSendConfirm(false);
      refetch();
      onSuccess?.();
    },
    onError: (err) => setError(err.message),
  });

  const { mutate: confirmOrder, isPending: isConfirming } = useConfirmPurchaseOrder({
    onSuccess: () => {
      showSuccess('Purchase order confirmed');
      setConfirmConfirm(false);
      refetch();
      onSuccess?.();
    },
    onError: (err) => setError(err.message),
  });

  const { mutate: receiveOrder, isPending: isReceiving } = useReceivePurchaseOrder({
    onSuccess: () => {
      showSuccess('Items received successfully');
      setReceiveConfirm(false);
      refetch();
      onSuccess?.();
    },
    onError: (err) => setError(err.message),
  });

  const { mutate: cancelOrder, isPending: isCanceling } = useCancelPurchaseOrder({
    onSuccess: () => {
      showSuccess('Purchase order canceled');
      setCancelConfirm(false);
      refetch();
      onSuccess?.();
    },
    onError: (err) => setError(err.message),
  });

  const isActing = isSending || isConfirming || isReceiving || isCanceling;

  // Handlers
  const handleSend = useCallback(() => {
    sendOrder(purchaseOrderId);
  }, [purchaseOrderId, sendOrder]);

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
      <Modal isOpen={isOpen} onClose={onClose} title="Purchase Order Details" size="lg">
        <LoadingState message="Loading purchase order..." />
      </Modal>
    );
  }

  // Error state
  if (fetchError || !purchaseOrder) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Purchase Order Details" size="lg">
        <Alert variant="error">
          {fetchError?.message || 'Purchase order not found'}
        </Alert>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Close
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
        title={`Purchase Order: ${purchaseOrder.poNumber}`}
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
              <h3 className="mb-4 text-lg font-medium text-white">Order Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="PO Number">
                  <span className="font-mono font-medium text-copper-400">
                    {purchaseOrder.poNumber}
                  </span>
                </InfoField>
                <InfoField label="Status">
                  <PurchaseOrderStatusBadge status={purchaseOrder.status} korean />
                </InfoField>
                <InfoField label="Vendor">
                  <span className="font-medium">{purchaseOrder.vendorName}</span>
                </InfoField>
                <InfoField label="Project">
                  <span className="text-steel-300">{purchaseOrder.jobCode}</span>
                </InfoField>
                <InfoField label="Order Date">
                  {formatDate(purchaseOrder.orderDate)}
                </InfoField>
                <InfoField label="Expected Delivery">
                  <span className={isOverdue ? 'font-medium text-red-400' : ''}>
                    {formatDate(purchaseOrder.expectedDeliveryDate)}
                    {isOverdue && (
                      <span className="ml-2 text-xs">(Overdue)</span>
                    )}
                  </span>
                </InfoField>
                <InfoField label="Total Amount">
                  <span className="text-lg font-semibold text-copper-400">
                    {formatCurrency(purchaseOrder.totalAmount, { currency: purchaseOrder.currency })}
                  </span>
                </InfoField>
                <InfoField label="Currency">
                  {purchaseOrder.currency}
                </InfoField>
              </div>
            </Card>

            {/* Notes */}
            {purchaseOrder.notes && (
              <Card className="p-4">
                <h3 className="mb-2 text-lg font-medium text-white">Notes</h3>
                <p className="text-steel-300">{purchaseOrder.notes}</p>
              </Card>
            )}

            {/* Metadata */}
            <div className="text-xs text-steel-500">
              Created by: {purchaseOrder.createdByName} | Created: {formatDateTime(purchaseOrder.createdAt)} |
              Updated: {formatDateTime(purchaseOrder.updatedAt)}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Info */}
            <Card className="p-4">
              <h3 className="mb-4 text-lg font-medium text-white">Related</h3>
              <div className="space-y-3">
                <InfoField label="Purchase Request">
                  <Link
                    to={`/purchase-requests/${purchaseOrder.purchaseRequestId}`}
                    className="font-medium text-copper-400 hover:text-copper-300 hover:underline"
                  >
                    {purchaseOrder.purchaseRequestNumber}
                  </Link>
                </InfoField>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4">
              <h3 className="mb-4 text-lg font-medium text-white">Actions</h3>
              <div className="space-y-2">
                {canSend && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => setSendConfirm(true)}
                    disabled={isActing}
                  >
                    <Icon name="paper-airplane" className="mr-2 h-4 w-4" />
                    Send to Vendor
                  </Button>
                )}

                {canConfirmOrder && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => setConfirmConfirm(true)}
                    disabled={isActing}
                  >
                    <Icon name="check-circle" className="mr-2 h-4 w-4" />
                    Confirm Order
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
                    Mark as Received
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
                    Cancel Order
                  </Button>
                )}

                {/* No actions available message */}
                {!canSend && !canConfirmOrder && !canReceiveOrder && !canCancelOrder && (
                  <p className="text-sm text-steel-400">
                    No actions available for this order.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalActions>
      </Modal>

      {/* Send Confirmation */}
      <ConfirmationModal
        isOpen={sendConfirm}
        title="Send Purchase Order"
        message={`Are you sure you want to send PO "${purchaseOrder.poNumber}" to ${purchaseOrder.vendorName}?`}
        confirmLabel="Send"
        onConfirm={handleSend}
        onClose={() => setSendConfirm(false)}
      />

      {/* Confirm Confirmation */}
      <ConfirmationModal
        isOpen={confirmConfirm}
        title="Confirm Purchase Order"
        message={`Mark PO "${purchaseOrder.poNumber}" as confirmed by the vendor?`}
        confirmLabel="Confirm"
        onConfirm={handleConfirm}
        onClose={() => setConfirmConfirm(false)}
      />

      {/* Receive Confirmation */}
      <ConfirmationModal
        isOpen={receiveConfirm}
        title="Mark as Received"
        message={`Mark PO "${purchaseOrder.poNumber}" as received? This will also close the parent purchase request.`}
        confirmLabel="Mark Received"
        variant="warning"
        onConfirm={handleReceive}
        onClose={() => setReceiveConfirm(false)}
      />

      {/* Cancel Confirmation */}
      <ConfirmationModal
        isOpen={cancelConfirm}
        title="Cancel Purchase Order"
        message={`Are you sure you want to cancel PO "${purchaseOrder.poNumber}"? This action cannot be undone.`}
        confirmLabel="Cancel Order"
        variant="danger"
        onConfirm={handleCancel}
        onClose={() => setCancelConfirm(false)}
      />
    </>
  );
}
