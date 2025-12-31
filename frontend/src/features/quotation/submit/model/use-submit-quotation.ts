/**
 * Submit Quotation for Approval Mutation Hook.
 *
 * Handles submitting a DRAFT quotation for approval workflow.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  submitQuotation,
  quotationQueries,
  type CommandResult,
} from '@/entities/quotation';

export interface UseSubmitQuotationOptions {
  /**
   * Called on successful submission.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for submitting a quotation for approval.
 *
 * Only valid for quotations with status = DRAFT.
 *
 * @example
 * ```tsx
 * function SubmitButton({ quotation }: { quotation: Quotation }) {
 *   const { mutate, isPending } = useSubmitQuotation({
 *     onSuccess: () => toast.success('Submitted for approval'),
 *   });
 *
 *   if (!quotationRules.canSubmit(quotation)) return null;
 *
 *   return (
 *     <Button onClick={() => mutate(quotation.id)} loading={isPending}>
 *       Submit for Approval
 *     </Button>
 *   );
 * }
 * ```
 */
export function useSubmitQuotation(options: UseSubmitQuotationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quotationId: number) => submitQuotation(quotationId),

    onSuccess: (result) => {
      // Invalidate both the detail and list queries
      queryClient.invalidateQueries({ queryKey: quotationQueries.details() });
      queryClient.invalidateQueries({ queryKey: quotationQueries.lists() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
