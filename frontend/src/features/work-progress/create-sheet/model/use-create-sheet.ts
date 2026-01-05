/**
 * Create Work Progress Sheet Mutation Hook.
 *
 * Handles creating a new work progress sheet for a project-product combination.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createWorkProgressSheet,
  workProgressQueries,
  type CreateWorkProgressSheetInput,
  type CommandResult,
} from '@/entities/work-progress';

export interface UseCreateSheetOptions {
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
 * Hook for creating a work progress sheet.
 *
 * @example
 * ```tsx
 * function CreateSheetForm({ projectId }: { projectId: number }) {
 *   const { mutate, isPending } = useCreateSheet({
 *     onSuccess: (result) => {
 *       toast.success('작업지 생성 완료');
 *       navigate(`/production/${result.id}`);
 *     },
 *   });
 *
 *   const handleSubmit = (data: FormData) => {
 *     mutate({
 *       projectId,
 *       productId: data.productId,
 *       quantity: data.quantity,
 *     });
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useCreateSheet(options: UseCreateSheetOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkProgressSheetInput) => createWorkProgressSheet(input),

    onSuccess: (result) => {
      // Invalidate lists and summaries for the project
      queryClient.invalidateQueries({ queryKey: workProgressQueries.lists() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.summaries() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
