/**
 * Update Quotation Mutation Hook.
 *
 * Handles updating an existing quotation with cache invalidation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateQuotation,
  quotationQueries,
  type UpdateQuotationInput,
  type CommandResult,
} from '@/entities/quotation';

export interface UseUpdateQuotationOptions {
  /**
   * Called on successful update.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

export interface UpdateQuotationParams {
  id: number;
  input: UpdateQuotationInput;
}

/**
 * Hook for updating an existing quotation.
 *
 * @example
 * ```tsx
 * function EditQuotationPage({ id }: { id: number }) {
 *   const { data: quotation } = useQuery(quotationQueries.detail(id));
 *   const navigate = useNavigate();
 *
 *   const { mutate, isPending, error } = useUpdateQuotation({
 *     onSuccess: () => {
 *       toast.success('Quotation updated');
 *       navigate(`/quotations/${id}`);
 *     },
 *   });
 *
 *   const handleSubmit = (data: UpdateQuotationInput) => {
 *     mutate({ id, input: data });
 *   };
 *
 *   return <QuotationForm quotation={quotation} onSubmit={handleSubmit} isLoading={isPending} />;
 * }
 * ```
 */
export function useUpdateQuotation(options: UseUpdateQuotationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateQuotationParams) => updateQuotation(id, input),

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
