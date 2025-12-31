/**
 * Assign customers mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userApi,
  userCommandMapper,
  userQueryKeys,
  type AssignCustomersInput,
} from '@/entities/user';

/**
 * Options for useAssignCustomers hook.
 */
export interface UseAssignCustomersOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Input for assign customers mutation.
 */
export interface AssignCustomersMutationInput {
  id: number;
  data: AssignCustomersInput;
}

/**
 * Mutation hook for assigning customers to a user.
 */
export function useAssignCustomers(options: UseAssignCustomersOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async ({ id, data }: AssignCustomersMutationInput) => {
      const command = userCommandMapper.toAssignCustomersCommand(data);
      const dto = userCommandMapper.toAssignCustomersDto(command);
      return userApi.assignCustomers(id, dto);
    },

    onSuccess: (_result, { id }) => {
      // Invalidate customer query for this user
      queryClient.invalidateQueries({ queryKey: userQueryKeys.customers(id) });

      onSuccess?.();
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
