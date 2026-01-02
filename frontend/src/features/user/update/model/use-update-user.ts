/**
 * Update user mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userApi,
  userCommandMapper,
  userQueries,
  type UpdateUserInput,
} from '@/entities/user';

/**
 * Options for useUpdateUser hook.
 */
export interface UseUpdateUserOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Input for update user mutation.
 */
export interface UpdateUserMutationInput {
  id: number;
  data: UpdateUserInput;
}

/**
 * Mutation hook for updating user details.
 */
export function useUpdateUser(options: UseUpdateUserOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async ({ id, data }: UpdateUserMutationInput) => {
      const command = userCommandMapper.toUpdateCommand(data);
      const dto = userCommandMapper.toUpdateDto(command);
      return userApi.update(id, dto);
    },

    onSuccess: (_result, { id: _id }) => {
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
