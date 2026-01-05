/**
 * Delete Work Progress Sheet Mutation Hook.
 *
 * Handles deleting a work progress sheet.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteWorkProgressSheet,
  workProgressQueries,
  type CommandResult,
} from '@/entities/work-progress';

export interface UseDeleteSheetOptions {
  /**
   * Called on successful deletion.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for deleting a work progress sheet.
 *
 * @example
 * ```tsx
 * function DeleteButton({ sheetId }: { sheetId: number }) {
 *   const { mutate, isPending } = useDeleteSheet({
 *     onSuccess: () => {
 *       toast.success('작업지 삭제 완료');
 *       navigate('/production');
 *     },
 *   });
 *
 *   return (
 *     <Button variant="danger" onClick={() => mutate(sheetId)} loading={isPending}>
 *       삭제
 *     </Button>
 *   );
 * }
 * ```
 */
export function useDeleteSheet(options: UseDeleteSheetOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sheetId: number) => deleteWorkProgressSheet(sheetId),

    onSuccess: (result) => {
      // Invalidate lists, details, and summaries
      queryClient.invalidateQueries({ queryKey: workProgressQueries.lists() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.details() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.summaries() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
