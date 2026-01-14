/**
 * Mark delivery as delivered mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markDelivered, deliveryQueries } from '@/entities/delivery';

interface UseMarkDeliveredOptions {
  onSuccess?: (result: { id: number; message: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for marking a delivery as delivered.
 * Invalidates delivery queries on success.
 */
export function useMarkDelivered(options: UseMarkDeliveredOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: number) => markDelivered(deliveryId),
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
