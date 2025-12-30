/**
 * Create New Quotation Version Mutation Hook.
 *
 * Handles creating a new version of an existing quotation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationApi, quotationQueryKeys } from '@/entities/quotation';
import type { CommandResult } from '@/entities/quotation/api/quotation.dto';

export interface UseCreateVersionOptions {
  /**
   * Called on successful version creation.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for creating a new version of a quotation.
 *
 * Only valid for quotations with status = APPROVED, SENT, or ACCEPTED.
 *
 * @example
 * ```tsx
 * function CreateVersionButton({ quotation }: { quotation: Quotation }) {
 *   const navigate = useNavigate();
 *   const { mutate, isPending } = useCreateVersion({
 *     onSuccess: (result) => {
 *       toast.success('New version created');
 *       navigate(`/quotations/${result.id}/edit`);
 *     },
 *   });
 *
 *   if (!quotationRules.canCreateNewVersion(quotation)) return null;
 *
 *   return (
 *     <Button onClick={() => mutate(quotation.id)} loading={isPending}>
 *       Create New Version
 *     </Button>
 *   );
 * }
 * ```
 */
export function useCreateVersion(options: UseCreateVersionOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: number) => {
      return quotationApi.createNewVersion(quotationId);
    },

    onSuccess: (result, quotationId) => {
      // Invalidate list queries to include new version
      queryClient.invalidateQueries({ queryKey: quotationQueryKeys.lists() });
      // Also invalidate the source quotation detail (version history may have changed)
      queryClient.invalidateQueries({ queryKey: quotationQueryKeys.detail(quotationId) });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
