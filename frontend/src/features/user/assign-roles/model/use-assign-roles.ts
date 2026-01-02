/**
 * Assign roles mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userApi,
  userCommandMapper,
  userQueries,
  type AssignRolesInput,
} from '@/entities/user';

/**
 * Options for useAssignRoles hook.
 */
export interface UseAssignRolesOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Input for assign roles mutation.
 */
export interface AssignRolesMutationInput {
  id: number;
  data: AssignRolesInput;
}

/**
 * Mutation hook for assigning roles to a user.
 */
export function useAssignRoles(options: UseAssignRolesOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async ({ id, data }: AssignRolesMutationInput) => {
      const command = userCommandMapper.toAssignRolesCommand(data);
      const dto = userCommandMapper.toAssignRolesDto(command);
      return userApi.assignRoles(id, dto);
    },

    onSuccess: () => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: userQueries.lists() });
      queryClient.invalidateQueries({ queryKey: userQueries.details() });

      onSuccess?.();
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
