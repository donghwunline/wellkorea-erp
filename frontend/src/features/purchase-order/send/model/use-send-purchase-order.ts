/**
 * Send Purchase Order Mutation Hook.
 *
 * Wraps the sendPurchaseOrder command function with TanStack Query mutation.
 * Transitions PO from DRAFT → SENT status.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendPurchaseOrder, purchaseOrderQueries } from '@/entities/purchase-order';

export interface UseSendPurchaseOrderOptions {
  /** Called after successfully sending the purchase order */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for sending a purchase order to the vendor.
 *
 * @example
 * const { mutate, isPending } = useSendPurchaseOrder({
 *   onSuccess: () => showSuccess('Purchase order sent to vendor'),
 *   onError: (err) => showError(err.message),
 * });
 *
 * mutate(purchaseOrderId);
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
