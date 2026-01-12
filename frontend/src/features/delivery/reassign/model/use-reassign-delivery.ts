/**
 * Reassign delivery to quotation mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reassignDelivery, deliveryQueries } from '@/entities/delivery';
import type { ReassignDeliveryInput } from '@/entities/delivery';

interface UseReassignDeliveryOptions {
  onSuccess?: (result: { id: number; message: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for reassigning a delivery to a different quotation.
 * Invalidates delivery queries on success.
 */
export function useReassignDelivery(options: UseReassignDeliveryOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReassignDeliveryInput) => reassignDelivery(input),
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
