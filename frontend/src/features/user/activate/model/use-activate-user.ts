/**
 * Activate user mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, userQueryKeys } from '@/entities/user';

/**
 * Options for useActivateUser hook.
 */
export interface UseActivateUserOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for activating a deactivated user.
 */
export function useActivateUser(options: UseActivateUserOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (id: number) => {
      return userApi.activate(id);
    },

    onSuccess: (_result, id) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(id) });

      onSuccess?.();
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
