/**
 * Add Role to Company Mutation Hook.
 *
 * Handles adding a new role to an existing company with cache invalidation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addRole,
  companyQueries,
  type AddRoleInput,
  type CommandResult,
} from '@/entities/company';

export type AddRoleParams = AddRoleInput;

export interface UseAddRoleOptions {
  /**
   * Called on successful role addition.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for adding a role to a company.
 *
 * @example
 * ```tsx
 * function AddRoleButton({ companyId }: { companyId: number }) {
 *   const { mutate, isPending } = useAddRole({
 *     onSuccess: () => {
 *       toast.success('역할이 추가되었습니다');
 *     },
 *   });
 *
 *   const handleAddRole = (roleType: RoleType) => {
 *     mutate({
 *       companyId,
 *       input: { roleType, notes: '' },
 *     });
 *   };
 *
 *   return <RoleSelector onSelect={handleAddRole} disabled={isPending} />;
 * }
 * ```
 */
export function useAddRole(options: UseAddRoleOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddRoleParams) => addRole(input),

    onSuccess: (result, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: companyQueries.lists() });
      queryClient.invalidateQueries({ queryKey: companyQueries.detail(variables.companyId).queryKey });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
