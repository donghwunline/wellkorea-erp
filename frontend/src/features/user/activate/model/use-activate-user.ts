/**
 * Activate user mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, userQueries } from '@/entities/user';

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
