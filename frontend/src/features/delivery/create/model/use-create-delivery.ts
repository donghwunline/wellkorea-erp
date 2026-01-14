/**
 * Create delivery mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDelivery, deliveryQueries } from '@/entities/delivery';
import type { CreateDeliveryInput } from '@/entities/delivery';

interface UseCreateDeliveryOptions {
  onSuccess?: (result: { id: number; message: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for creating a new delivery.
 * Invalidates delivery list cache on success.
 */
export function useCreateDelivery(options: UseCreateDeliveryOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeliveryInput) => createDelivery(input),
    onSuccess: result => {
      // Invalidate delivery queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: deliveryQueries.all() });
      options.onSuccess?.(result);
    },
    onError: error => {
      options.onError?.(error as Error);
    },
  });
}
