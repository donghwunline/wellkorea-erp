/**
 * Remove Role from Company Mutation Hook.
 *
 * Handles removing a role from a company with cache invalidation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  removeRole,
  companyQueries,
  type RemoveRoleInput,
} from '@/entities/company';

export type RemoveRoleParams = RemoveRoleInput;

export interface UseRemoveRoleOptions {
  /**
   * Called on successful role removal.
   */
  onSuccess?: () => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for removing a role from a company.
 *
 * @example
 * ```tsx
 * function RemoveRoleButton({ companyId, roleId }: Props) {
 *   const { mutate, isPending } = useRemoveRole({
 *     onSuccess: () => {
 *       toast.success('역할이 삭제되었습니다');
 *     },
 *   });
 *
 *   const handleRemove = () => {
 *     mutate({
 *       companyId,
 *       input: { roleId },
 *     });
 *   };
 *
 *   return (
 *     <Button onClick={handleRemove} disabled={isPending}>
 *       역할 삭제
 *     </Button>
 *   );
 * }
 * ```
 */
export function useRemoveRole(options: UseRemoveRoleOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RemoveRoleParams) => removeRole(input),

    onSuccess: (_result, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: companyQueries.lists() });
      queryClient.invalidateQueries({ queryKey: companyQueries.detail(variables.companyId).queryKey });
      options.onSuccess?.();
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
