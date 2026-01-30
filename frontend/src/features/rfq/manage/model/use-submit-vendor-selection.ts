/**
 * Submit Vendor Selection for Approval Mutation Hook.
 *
 * Wraps the submitVendorSelectionForApproval command function with TanStack Query mutation.
 * Invalidates purchase request and approval queries on success.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  submitVendorSelectionForApproval,
  purchaseRequestQueries,
} from '@/entities/purchase-request';
import { approvalQueries } from '@/entities/approval';

export interface UseSubmitVendorSelectionOptions {
  /** Called after successfully submitting for approval */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for submitting vendor selection for approval.
 *
 * When submitted:
 * 1. Creates an approval request for the vendor selection
 * 2. Updates the PurchaseRequest status to PENDING_VENDOR_APPROVAL
 * 3. Stores the selected RFQ item ID for later use after approval
 *
 * @example
 * const { mutate, isPending } = useSubmitVendorSelection({
 *   onSuccess: () => toast('Submitted for approval'),
 *   onError: (err) => showError(err.message),
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
      options?.onError?.(error);
    },
  });
}
