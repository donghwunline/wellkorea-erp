/**
 * Confirm Purchase Order Mutation Hook.
 *
 * Wraps the confirmPurchaseOrder command function with TanStack Query mutation.
 * Transitions PO from SENT → CONFIRMED status (vendor confirmation).
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmPurchaseOrder, purchaseOrderQueries } from '@/entities/purchase-order';

export interface UseConfirmPurchaseOrderOptions {
  /** Called after successfully confirming the purchase order */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for confirming a purchase order (vendor confirmation).
 *
 * @example
 * const { mutate, isPending } = useConfirmPurchaseOrder({
 *   onSuccess: () => showSuccess('Purchase order confirmed by vendor'),
 *   onError: (err) => showError(err.message),
 * });
 *
 * mutate(purchaseOrderId);
 */
export function useConfirmPurchaseOrder(options?: UseConfirmPurchaseOrderOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmPurchaseOrder,
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
