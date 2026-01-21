/**
 * Send RFQ Mutation Hook.
 *
 * Wraps the sendRfq command function with TanStack Query mutation.
 * Invalidates purchase request queries on success.
 * Supports email notifications to selected vendors.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendRfq, purchaseRequestQueries } from '@/entities/purchase-request';

export interface UseSendRfqOptions {
  /** Called after successful RFQ send */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for sending RFQ to vendors with email notifications.
 *
 * @example
 * const { mutate, isPending } = useSendRfq({
 *   onSuccess: () => toast.success('RFQ sent!'),
 *   onError: (err) => toast.error(err.message),
 * });
 *
 * mutate({
 *   purchaseRequestId: 123,
 *   vendorIds: [1, 2, 3],
 *   vendorEmails: {
 *     1: { to: 'vendor1@example.com', ccEmails: ['cc@company.com'] },
 *     2: { to: 'vendor2@example.com' },
 *     // vendor 3 uses default email
 *   },
 * });
 */
export function useSendRfq(options?: UseSendRfqOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendRfq,
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
