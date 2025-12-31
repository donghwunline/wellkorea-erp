/**
 * Deactivate user mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, userQueryKeys } from '@/entities/user';

/**
 * Options for useDeactivateUser hook.
 */
export interface UseDeactivateUserOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for deactivating a user.
 */
export function useDeactivateUser(options: UseDeactivateUserOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (id: number) => {
      return userApi.deactivate(id);
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
