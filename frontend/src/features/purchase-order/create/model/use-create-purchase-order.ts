/**
 * Create Purchase Order Mutation Hook.
 *
 * Wraps the createPurchaseOrder command function with TanStack Query mutation.
 * Invalidates purchase request queries on success.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPurchaseOrder, purchaseOrderQueries } from '@/entities/purchase-order';
import { purchaseRequestQueries } from '@/entities/purchase-request';

export interface UseCreatePurchaseOrderOptions {
  /** Called after successfully creating the purchase order */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for creating a purchase order from an RFQ item.
 *
 * @example
 * const { mutate, isPending } = useCreatePurchaseOrder({
 *   onSuccess: () => showSuccess('Purchase order created'),
 *   onError: (err) => showError(err.message),
 * });
 *
 * mutate({
 *   purchaseRequestId: 123,
 *   rfqItemId: 'uuid-string',
 *   orderDate: '2024-01-15',
 *   expectedDeliveryDate: '2024-01-30',
 *   notes: 'Rush order',
 * });
 */
export function useCreatePurchaseOrder(options?: UseCreatePurchaseOrderOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      // Invalidate purchase request queries to refresh RFQ items (now with PO)
      queryClient.invalidateQueries({
        queryKey: purchaseRequestQueries.all(),
      });
      // Invalidate purchase order queries
      queryClient.invalidateQueries({
        queryKey: purchaseOrderQueries.lists(),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
