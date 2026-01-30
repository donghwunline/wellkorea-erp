/**
 * Submit Vendor Selection for Approval Mutation Hook.
 *
 * Wraps the submitVendorSelectionForApproval command function with TanStack Query mutation.
 * Invalidates purchase request and approval queries on success.
 * Handles 409 conflict errors (optimistic locking failures) with auto-invalidation.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  submitVendorSelectionForApproval,
  purchaseRequestQueries,
} from '@/entities/purchase-request';
import { approvalQueries } from '@/entities/approval';
import { ApiError } from '@/shared/api';

export interface UseSubmitVendorSelectionOptions {
  /** Called after successfully submitting for approval */
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
 * Mutation hook for submitting vendor selection for approval.
 *
 * When submitted:
 * 1. Creates an approval request for the vendor selection
 * 2. Updates the PurchaseRequest status to PENDING_VENDOR_APPROVAL
 * 3. Stores the selected RFQ item ID for later use after approval
 *
 * On 409 conflict (concurrent modification):
 * - Auto-invalidates purchase request queries to refresh stale data
 * - Calls onConflict callback if provided, otherwise onError
 *
 * @example
 * const { mutate, isPending } = useSubmitVendorSelection({
 *   onSuccess: () => toast.success('Submitted for approval'),
 *   onConflict: () => toast.error('Data was modified. Please review and try again.'),
 *   onError: (err) => toast.error(err.message),
 * });
 *
 * mutate({ purchaseRequestId: 123, itemId: 'uuid-string' });
 */
export function useSubmitVendorSelection(options?: UseSubmitVendorSelectionOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitVendorSelectionForApproval,
    onSuccess: () => {
      // Invalidate purchase request queries to refresh data
      queryClient.invalidateQueries({
        queryKey: purchaseRequestQueries.all(),
      });
      // Invalidate approval queries as a new approval request was created
      queryClient.invalidateQueries({
        queryKey: approvalQueries.all(),
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
