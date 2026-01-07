/**
 * Hook for saving task flow changes.
 * Wraps the saveTaskFlow command with TanStack Query mutation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) handled by consumer via callbacks
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  saveTaskFlow,
  taskFlowQueries,
  type SaveTaskFlowInput,
  type CommandResult,
} from '@/entities/task-flow';

export interface UseSaveFlowOptions {
  /** Called on successful save */
  onSuccess?: (result: CommandResult) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Hook for saving task flow with mutation.
 * Invalidates queries on success.
 *
 * @example
 * ```tsx
 * const { mutate: save, isPending } = useSaveFlow({
 *   onSuccess: () => {
 *     toast.success('Task flow saved');
 *     setHasChanges(false);
 *   },
 * });
 *
 * const handleSave = () => {
 *   save({ id: flowId, nodes, edges });
 * };
 * ```
 */
export function useSaveFlow(options?: UseSaveFlowOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveTaskFlowInput) => saveTaskFlow(input),

    onSuccess: (result) => {
      // Invalidate task flow queries to refetch
      queryClient.invalidateQueries({ queryKey: taskFlowQueries.all() });
      options?.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
