/**
 * Cancel Purchase Order Mutation Hook.
 *
 * Wraps the cancelPurchaseOrder command function with TanStack Query mutation.
 * Transitions PO to CANCELED status (except from RECEIVED or already CANCELED).
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelPurchaseOrder, purchaseOrderQueries } from '@/entities/purchase-order';
import { purchaseRequestQueries } from '@/entities/purchase-request';

export interface UseCancelPurchaseOrderOptions {
  /** Called after successfully canceling the purchase order */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for canceling a purchase order.
 *
 * @example
 * const { mutate, isPending } = useCancelPurchaseOrder({
 *   onSuccess: () => showSuccess('Purchase order canceled'),
 *   onError: (err) => showError(err.message),
 * });
 *
 * mutate(purchaseOrderId);
 */
export function useCancelPurchaseOrder(options?: UseCancelPurchaseOrderOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPurchaseOrder,
    onSuccess: () => {
      // Invalidate purchase order queries
      queryClient.invalidateQueries({
        queryKey: purchaseOrderQueries.all(),
      });
      // Canceling might affect purchase request state
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
