/**
 * Create Quotation Mutation Hook.
 *
 * Handles creating a new quotation with optimistic updates
 * and cache invalidation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  quotationApi,
  quotationCommandMapper,
  quotationQueryKeys,
  quotationValidation,
  type CreateQuotationInput,
} from '@/entities/quotation';
import type { CommandResult } from '@/entities/quotation/api/quotation.dto';

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
    mutationFn: async (input: CreateQuotationInput) => {
      // Two-step command mapping: Input → Command (validation) → DTO
      const command = quotationCommandMapper.toCreateCommand(input);
      quotationValidation.validateCreate(command);
      const dto = quotationCommandMapper.toCreateDto(command);
      return quotationApi.create(dto);
    },

    onSuccess: result => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: quotationQueryKeys.lists() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
