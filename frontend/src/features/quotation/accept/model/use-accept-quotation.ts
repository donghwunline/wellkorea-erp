/**
 * Accept Quotation Mutation Hook.
 *
 * Handles marking a quotation as accepted by customer.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  acceptQuotation,
  quotationQueries,
  type CommandResult,
} from '@/entities/quotation';

export interface UseAcceptQuotationOptions {
  /**
   * Called on successful acceptance.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for accepting a quotation (marking as accepted by customer).
 *
 * Only valid for quotations with status = SENT or APPROVED.
 * Also invalidates project queries since project status may change to ACTIVE.
 *
 * @example
 * ```tsx
 * function AcceptButton({ quotation }: { quotation: Quotation }) {
 *   const { mutate, isPending } = useAcceptQuotation({
 *     onSuccess: () => toast.success('Quotation accepted'),
 *   });
 *
 *   if (!quotationRules.canAccept(quotation)) return null;
 *
 *   return (
 *     <Button onClick={() => mutate(quotation.id)} loading={isPending}>
 *       Accept
 *     </Button>
 *   );
 * }
 * ```
 */
export function useAcceptQuotation(options: UseAcceptQuotationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quotationId: number) => acceptQuotation(quotationId),

    onSuccess: (result) => {
      // Invalidate quotation queries
      queryClient.invalidateQueries({ queryKey: quotationQueries.details() });
      queryClient.invalidateQueries({ queryKey: quotationQueries.lists() });
      // Also invalidate project queries since project status may change
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
