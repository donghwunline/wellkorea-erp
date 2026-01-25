/**
 * Mark delivery as delivered with photo mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadDeliveryPhoto,
  deliveryQueries,
  type UploadDeliveryPhotoInput,
} from '@/entities/delivery';

interface UseMarkDeliveredWithPhotoOptions {
  onSuccess?: (result: { id: number; message: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for marking a delivery as delivered with a proof-of-delivery photo.
 * Handles the 3-step upload flow and invalidates queries on success.
 */
export function useMarkDeliveredWithPhoto(options: UseMarkDeliveredWithPhotoOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadDeliveryPhotoInput) => uploadDeliveryPhoto(input),
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
