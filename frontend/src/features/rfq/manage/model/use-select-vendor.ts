/**
 * Select Vendor Mutation Hook.
 *
 * Wraps the selectVendor command function with TanStack Query mutation.
 * Invalidates purchase request queries on success.
 * Backend auto-rejects other REPLIED RFQ items.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { selectVendor, purchaseRequestQueries } from '@/entities/purchase-request';

export interface UseSelectVendorOptions {
  /** Called after successfully selecting vendor (backend auto-rejects others) */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for selecting a vendor for an RFQ.
 *
 * When a vendor is selected, the backend automatically:
 * 1. Sets the selected RFQ item status to SELECTED
 * 2. Rejects all other REPLIED RFQ items (status → REJECTED)
 * 3. Updates the PurchaseRequest status to VENDOR_SELECTED
 *
 * @example
 * const { mutate, isPending } = useSelectVendor({
 *   onSuccess: () => showCreatePoPrompt(),
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
      options?.onError?.(error);
    },
  });
}
