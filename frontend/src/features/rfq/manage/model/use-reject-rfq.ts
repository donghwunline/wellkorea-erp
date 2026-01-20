/**
 * Reject RFQ Mutation Hook.
 *
 * Wraps the rejectRfq command function with TanStack Query mutation.
 * Invalidates purchase request queries on success.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rejectRfq, purchaseRequestQueries } from '@/entities/purchase-request';

export interface UseRejectRfqOptions {
  /** Called after successfully rejecting RFQ item */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for rejecting a vendor's quote.
 *
 * @example
 * const { mutate, isPending } = useRejectRfq({
 *   onSuccess: () => showSuccess('Quote rejected'),
 *   onError: (err) => showError(err.message),
 * });
 *
 * mutate({ purchaseRequestId: 123, itemId: 'uuid-string' });
 */
export function useRejectRfq(options?: UseRejectRfqOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectRfq,
    onSuccess: () => {
      // Invalidate all purchase request queries to refresh data
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
