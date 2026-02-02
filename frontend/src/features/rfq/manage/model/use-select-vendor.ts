/**
 * Select Vendor Mutation Hook.
 *
 * Wraps the selectVendor command function with TanStack Query mutation.
 * Invalidates purchase request queries on success.
 * Backend auto-rejects other REPLIED RFQ items.
 * Handles 409 conflict errors (optimistic locking failures) with auto-invalidation.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseRequestQueries, selectVendor } from '@/entities/purchase-request';
import { ApiError } from '@/shared/api';

export interface UseSelectVendorOptions {
  /** Called after successfully selecting vendor (backend auto-rejects others) */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /**
   * Called when a 409 conflict error occurs (concurrent modification).
   * If not provided, onError is called instead.
   * Queries are auto-invalidated before this callback.
   */
  onConflict?: (error: ApiError) => void;
}

/**
 * Mutation hook for selecting a vendor for an RFQ.
 *
 * When a vendor is selected, the backend automatically:
 * 1. Sets the selected RFQ item status to SELECTED
 * 2. Rejects all other REPLIED RFQ items (status → REJECTED)
 * 3. Updates the PurchaseRequest status to VENDOR_SELECTED
 *
 * On 409 conflict (concurrent modification):
 * - Auto-invalidates purchase request queries to refresh stale data
 * - Calls onConflict callback if provided, otherwise onError
 *
 * @example
 * const { mutate, isPending } = useSelectVendor({
 *   onSuccess: () => showCreatePoPrompt(),
 *   onConflict: () => toast.error('Data was modified. Please review and try again.'),
 *   onError: (err) => showError(err.message),
 * });
 *
 * mutate({ purchaseRequestId: 123, itemId: 'uuid-string' });
 */
export function useSelectVendor(options?: UseSelectVendorOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: selectVendor,
    onSuccess: () => {
      // Invalidate all purchase request queries to refresh data
      queryClient.invalidateQueries({
        queryKey: purchaseRequestQueries.all(),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      // Handle 409 conflict (optimistic locking failure)
      if (error instanceof ApiError && error.status === 409) {
        // Auto-invalidate to refresh stale data
        queryClient.invalidateQueries({
          queryKey: purchaseRequestQueries.all(),
        });

        // Call conflict-specific callback or fall back to onError
        if (options?.onConflict) {
          options.onConflict(error);
          return;
        }
      }

      options?.onError?.(error);
    },
  });
}
