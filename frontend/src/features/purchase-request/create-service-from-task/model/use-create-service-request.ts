/**
 * Create Service Purchase Request Mutation Hook.
 *
 * Handles creating a new service (outsourcing) purchase request
 * with cache invalidation.
 *
 * Features Layer: Isolated user action from task node
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createServicePurchaseRequest,
  purchaseRequestQueries,
  type CreateServicePurchaseRequestInput,
} from '@/entities/purchase-request';

export interface UseCreateServiceRequestOptions {
  /**
   * Called on successful creation.
   */
  onSuccess?: (result: { id: number; message: string }) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for creating a new service purchase request from a task node.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateServiceRequest({
 *   onSuccess: () => {
 *     toast.success('외주 요청이 생성되었습니다');
 *     onClose();
 *   },
 * });
 *
 * const handleSubmit = (data: CreateServicePurchaseRequestInput) => {
 *   mutate(data);
 * };
 * ```
 */
export function useCreateServiceRequest(options: UseCreateServiceRequestOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServicePurchaseRequestInput) => createServicePurchaseRequest(input),

    onSuccess: result => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: purchaseRequestQueries.lists() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
