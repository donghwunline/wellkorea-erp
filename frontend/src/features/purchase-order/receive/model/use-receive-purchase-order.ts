/**
 * Receive Purchase Order Mutation Hook.
 *
 * Wraps the receivePurchaseOrder command function with TanStack Query mutation.
 * Transitions PO from CONFIRMED → RECEIVED status and closes the parent PurchaseRequest.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { receivePurchaseOrder, purchaseOrderQueries } from '@/entities/purchase-order';
import { purchaseRequestQueries } from '@/entities/purchase-request';

export interface UseReceivePurchaseOrderOptions {
  /** Called after successfully marking the purchase order as received */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for marking a purchase order as received.
 * This also closes the parent PurchaseRequest on the backend.
 *
 * @example
 * const { mutate, isPending } = useReceivePurchaseOrder({
 *   onSuccess: () => showSuccess('Items received, order complete'),
 *   onError: (err) => showError(err.message),
 * });
 *
 * mutate(purchaseOrderId);
 */
export function useReceivePurchaseOrder(options?: UseReceivePurchaseOrderOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: receivePurchaseOrder,
    onSuccess: () => {
      // Invalidate purchase order queries
      queryClient.invalidateQueries({
        queryKey: purchaseOrderQueries.all(),
      });
      // Receiving closes parent PurchaseRequest, so invalidate those too
      queryClient.invalidateQueries({
        queryKey: purchaseRequestQueries.all(),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
