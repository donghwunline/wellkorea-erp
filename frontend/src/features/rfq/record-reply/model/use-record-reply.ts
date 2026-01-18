/**
 * Record RFQ Reply Mutation Hook.
 *
 * Wraps the recordRfqReply command function with TanStack Query mutation.
 * Invalidates purchase request queries on success.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordRfqReply, purchaseRequestQueries } from '@/entities/purchase-request';

export interface UseRecordReplyOptions {
  /** Called after successfully recording vendor reply */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for recording a vendor's RFQ reply.
 *
 * @example
 * const { mutate, isPending } = useRecordReply({
 *   onSuccess: () => showSuccess('Quote recorded'),
 *   onError: (err) => showError(err.message),
 * });
 *
 * mutate({
 *   purchaseRequestId: 123,
 *   itemId: 'uuid-string',
 *   quotedPrice: 15000,
 *   quotedLeadTime: 14,
 *   notes: 'Additional details',
 * });
 */
export function useRecordReply(options?: UseRecordReplyOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordRfqReply,
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
