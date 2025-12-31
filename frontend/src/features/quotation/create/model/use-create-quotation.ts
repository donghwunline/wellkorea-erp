/**
 * Create Quotation Mutation Hook.
 *
 * Handles creating a new quotation with cache invalidation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createQuotation,
  quotationQueries,
  type CreateQuotationInput,
  type CommandResult,
} from '@/entities/quotation';

export interface UseCreateQuotationOptions {
  /**
   * Called on successful creation.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for creating a new quotation.
 *
 * @example
 * ```tsx
 * function CreateQuotationPage() {
 *   const navigate = useNavigate();
 *   const { mutate, isPending, error } = useCreateQuotation({
 *     onSuccess: (result) => {
 *       toast.success('Quotation created');
 *       navigate(`/quotations/${result.id}`);
 *     },
 *   });
 *
 *   const handleSubmit = (data: CreateQuotationInput) => {
 *     mutate(data);
 *   };
 *
 *   return <QuotationForm onSubmit={handleSubmit} isLoading={isPending} />;
 * }
 * ```
 */
export function useCreateQuotation(options: UseCreateQuotationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateQuotationInput) => createQuotation(input),

    onSuccess: result => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: quotationQueries.lists() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
