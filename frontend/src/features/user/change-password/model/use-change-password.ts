/**
 * Change password mutation hook.
 */

import { useMutation } from '@tanstack/react-query';
import {
  userApi,
  userCommandMapper,
  type ChangePasswordInput,
} from '@/entities/user';

/**
 * Options for useChangePassword hook.
 */
export interface UseChangePasswordOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Input for change password mutation.
 */
export interface ChangePasswordMutationInput {
  id: number;
  data: ChangePasswordInput;
}

/**
 * Mutation hook for changing user password.
 */
export function useChangePassword(options: UseChangePasswordOptions = {}) {
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async ({ id, data }: ChangePasswordMutationInput) => {
      const command = userCommandMapper.toChangePasswordCommand(data);
      const dto = userCommandMapper.toChangePasswordDto(command);
      return userApi.changePassword(id, dto);
    },

    onSuccess: () => {
      // No cache invalidation needed - password doesn't appear in queries
      onSuccess?.();
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
