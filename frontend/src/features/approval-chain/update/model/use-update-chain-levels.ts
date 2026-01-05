/**
 * Update Chain Levels Mutation Hook.
 *
 * Handles updating approval chain levels with cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateChainLevels,
  chainTemplateQueries,
  type ChainLevelInput,
  type ChainCommandResult,
} from '@/entities/approval-chain';

/**
 * Input for update chain levels mutation.
 */
export interface UpdateChainLevelsInput {
  /**
   * Chain template ID.
   */
  templateId: number;

  /**
   * New chain levels.
   */
  levels: ChainLevelInput[];
}

/**
 * Options for useUpdateChainLevels hook.
 */
export interface UseUpdateChainLevelsOptions {
  /**
   * Callback on successful update.
   */
  onSuccess?: (result: ChainCommandResult) => void;

  /**
   * Callback on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for updating chain levels.
 *
 * Features:
 * - Invalidates chain template caches after update
 * - Provides loading and error states
 * - UX callbacks for toast notifications
 *
 * @example
 * ```tsx
 * function ChainEditor({ templateId }: Props) {
 *   const [levels, setLevels] = useState<ChainLevelInput[]>([]);
 *   const { mutate: update, isPending } = useUpdateChainLevels({
 *     onSuccess: () => toast.success('Chain updated successfully'),
 *     onError: (err) => toast.error(err.message),
 *   });
 *
 *   const handleSave = () => {
 *     update({ templateId, levels });
 *   };
 *
 *   return (
 *     <button onClick={handleSave} disabled={isPending}>
 *       {isPending ? 'Saving...' : 'Save'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useUpdateChainLevels(options: UseUpdateChainLevelsOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: (input: UpdateChainLevelsInput) =>
      updateChainLevels(input.templateId, input.levels),

    onSuccess: (result) => {
      // Invalidate chain template caches
      queryClient.invalidateQueries({ queryKey: chainTemplateQueries.all() });
      queryClient.invalidateQueries({ queryKey: chainTemplateQueries.details() });

      onSuccess?.(result);
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
