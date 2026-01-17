/**
 * Create Material Purchase Request Mutation Hook.
 *
 * Handles creating a new material purchase request with cache invalidation.
 *
 * Features Layer: Isolated user action from task node
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createMaterialPurchaseRequest,
  purchaseRequestQueries,
  type CreateMaterialPurchaseRequestInput,
} from '@/entities/purchase-request';

export interface UseCreateMaterialRequestOptions {
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
 * Hook for creating a new material purchase request from a task node.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateMaterialRequest({
 *   onSuccess: () => {
 *     toast.success('구매 요청이 생성되었습니다');
 *     onClose();
 *   },
 * });
 *
 * const handleSubmit = (data: CreateMaterialPurchaseRequestInput) => {
 *   mutate(data);
 * };
 * ```
 */
export function useCreateMaterialRequest(options: UseCreateMaterialRequestOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMaterialPurchaseRequestInput) => createMaterialPurchaseRequest(input),

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
