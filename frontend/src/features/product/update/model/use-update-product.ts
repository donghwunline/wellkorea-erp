/**
 * Update Product Mutation Hook.
 *
 * Handles updating an existing product with cache invalidation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateProduct,
  productQueries,
  type UpdateProductInput,
  type ProductCommandResult,
} from '@/entities/product';

export interface UseUpdateProductOptions {
  /**
   * Called on successful update.
   */
  onSuccess?: (result: ProductCommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for updating an existing product.
 *
 * @example
 * ```tsx
 * function EditProductModal({ product, onClose }) {
 *   const { mutate, isPending, error } = useUpdateProduct({
 *     onSuccess: (result) => {
 *       toast.success('품목이 수정되었습니다');
 *       onClose();
 *     },
 *   });
 *
 *   const handleSubmit = (data: UpdateProductInput) => {
 *     mutate(data);
 *   };
 *
 *   return <ProductForm product={product} onSubmit={handleSubmit} isLoading={isPending} />;
 * }
 * ```
 */
export function useUpdateProduct(options: UseUpdateProductOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(input),

    onSuccess: (result, variables) => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: productQueries.lists() });
      // Invalidate detail query for the updated product
      queryClient.invalidateQueries({ queryKey: productQueries.detail(variables.id).queryKey });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
