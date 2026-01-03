/**
 * Create user mutation hook.
 *
 * Encapsulates user creation workflow with:
 * - API call via command function
 * - Cache invalidation
 * - Success/error callbacks
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser, userQueries, type CreateUserInput } from '@/entities/user';

/**
 * Options for useCreateUser hook.
 */
export interface UseCreateUserOptions {
  /**
   * Callback on successful creation.
   */
  onSuccess?: () => void;

  /**
   * Callback on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for creating a new user.
 *
 * @example
 * ```tsx
 * function CreateUserForm({ onClose }: Props) {
 *   const { mutate: create, isPending, error } = useCreateUser({
 *     onSuccess: () => {
 *       toast.success('User created successfully');
 *       onClose();
 *     },
 *   });
 *
 *   const handleSubmit = (data: CreateUserInput) => {
 *     create(data);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useCreateUser(options: UseCreateUserOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),

    onSuccess: () => {
      // Invalidate user list queries
      queryClient.invalidateQueries({ queryKey: userQueries.lists() });

      onSuccess?.();
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
