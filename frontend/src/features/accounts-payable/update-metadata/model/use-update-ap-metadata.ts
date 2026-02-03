/**
 * Update AP metadata mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateAPInput, UpdateAPResult } from '@/entities/accounts-payable';
import { accountsPayableQueries, updateAccountsPayable } from '@/entities/accounts-payable';

interface UseUpdateAPMetadataOptions {
  onSuccess?: (result: UpdateAPResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for updating AP metadata (due date, notes).
 * Invalidates AP caches on success.
 */
export function useUpdateAPMetadata(options: UseUpdateAPMetadataOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateAPInput }) =>
      updateAccountsPayable(id, input),
    onSuccess: result => {
      // Invalidate all AP queries to refresh data
      queryClient.invalidateQueries({ queryKey: accountsPayableQueries.all() });
      options.onSuccess?.(result);
    },
    onError: error => {
      options.onError?.(error as Error);
    },
  });
}
