/**
 * Mark delivery as returned mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markReturned, deliveryQueries } from '@/entities/delivery';

interface UseMarkReturnedOptions {
  onSuccess?: (result: { id: number; message: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for marking a delivery as returned.
 * Invalidates delivery queries on success.
 */
export function useMarkReturned(options: UseMarkReturnedOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: number) => markReturned(deliveryId),
    onSuccess: result => {
      // Invalidate all delivery queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: deliveryQueries.all() });
      options.onSuccess?.(result);
    },
    onError: error => {
      options.onError?.(error as Error);
    },
  });
}
