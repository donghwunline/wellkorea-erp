/**
 * Send Purchase Order Mutation Hook.
 *
 * Wraps the sendPurchaseOrder command function with TanStack Query mutation.
 * Transitions PO from DRAFT → SENT status and sends email notification.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sendPurchaseOrder,
  purchaseOrderQueries,
} from '@/entities/purchase-order';

export interface UseSendPurchaseOrderOptions {
  /** Called after successfully sending the purchase order */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for sending a purchase order to the vendor with email notification.
 *
 * @example
 * const { mutate, isPending } = useSendPurchaseOrder({
 *   onSuccess: () => showSuccess('Purchase order sent to vendor'),
 *   onError: (err) => showError(err.message),
 * });
 *
 * mutate({
 *   purchaseOrderId: 123,
 *   to: 'vendor@example.com',
 *   ccEmails: ['buyer@wellkorea.com'],
 * });
 */
export function useSendPurchaseOrder(options?: UseSendPurchaseOrderOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: purchaseOrderQueries.all(),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
