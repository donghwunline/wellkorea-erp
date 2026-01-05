/**
 * Create Product Mutation Hook.
 *
 * Handles creating a new product with cache invalidation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProduct,
  productQueries,
  type CreateProductInput,
  type ProductCommandResult,
} from '@/entities/product';

export interface UseCreateProductOptions {
  /**
   * Called on successful creation.
   */
  onSuccess?: (result: ProductCommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for creating a new product.
 *
 * @example
 * ```tsx
 * function CreateProductModal({ onClose }) {
 *   const { mutate, isPending, error } = useCreateProduct({
 *     onSuccess: (result) => {
 *       toast.success('품목이 생성되었습니다');
 *       onClose();
 *     },
 *   });
 *
 *   const handleSubmit = (data: CreateProductInput) => {
 *     mutate(data);
 *   };
 *
 *   return <ProductForm onSubmit={handleSubmit} isLoading={isPending} />;
 * }
 * ```
 */
export function useCreateProduct(options: UseCreateProductOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),

    onSuccess: result => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: productQueries.lists() });
      // Also invalidate types in case new product affects type counts
      queryClient.invalidateQueries({ queryKey: productQueries.types() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
