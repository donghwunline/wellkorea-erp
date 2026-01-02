/**
 * Update Chain Levels Mutation Hook.
 *
 * Handles updating approval chain levels with cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chainTemplateApi, chainTemplateQueries, type ChainLevelInput } from '@/entities/approval-chain';

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
 * Command result from update operation.
 */
interface CommandResult {
  id: number;
  message: string;
}

/**
 * Options for useUpdateChainLevels hook.
 */
export interface UseUpdateChainLevelsOptions {
  /**
   * Callback on successful update.
   */
  onSuccess?: (result: CommandResult) => void;

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
 *   const { mutate: updateLevels, isPending } = useUpdateChainLevels({
 *     onSuccess: () => toast.success('Chain updated successfully'),
 *     onError: (err) => toast.error(err.message),
 *   });
 *
 *   const handleSave = () => {
 *     updateLevels({ templateId, levels });
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
    mutationFn: async (input: UpdateChainLevelsInput): Promise<CommandResult> => {
      return chainTemplateApi.updateLevels(input.templateId, input.levels);
    },

    onSuccess: (result, _input) => {
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
