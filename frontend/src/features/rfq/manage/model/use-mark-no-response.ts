/**
 * Mark No Response Mutation Hook.
 *
 * Wraps the markRfqNoResponse command function with TanStack Query mutation.
 * Invalidates purchase request queries on success.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markRfqNoResponse, purchaseRequestQueries } from '@/entities/purchase-request';

export interface UseMarkNoResponseOptions {
  /** Called after successfully marking vendor as non-responsive */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for marking an RFQ item as no response.
 *
 * @example
 * const { mutate, isPending } = useMarkNoResponse({
 *   onSuccess: () => showSuccess('Marked as no response'),
 *   onError: (err) => showError(err.message),
 * });
 *
 * mutate({ purchaseRequestId: 123, itemId: 'uuid-string' });
 */
export function useMarkNoResponse(options?: UseMarkNoResponseOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markRfqNoResponse,
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
