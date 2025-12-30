/**
 * Update Quotation Mutation Hook.
 *
 * Handles updating an existing quotation with optimistic updates
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
  type UpdateQuotationInput,
} from '@/entities/quotation';
import type { CommandResult } from '@/entities/quotation/api/quotation.dto';

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
 *   const { data: quotation } = useQuotation({ id });
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
    mutationFn: async ({ id, input }: UpdateQuotationParams) => {
      // Two-step command mapping: Input → Command (validation) → DTO
      const command = quotationCommandMapper.toUpdateCommand(input);
      quotationValidation.validateUpdate(command);
      const dto = quotationCommandMapper.toUpdateDto(command);
      return quotationApi.update(id, dto);
    },

    onSuccess: (result, variables) => {
      // Invalidate both the detail and list queries
      queryClient.invalidateQueries({ queryKey: quotationQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: quotationQueryKeys.lists() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
