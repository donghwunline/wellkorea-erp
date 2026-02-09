/**
 * Update invoice discount mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateInvoiceDiscountInput } from '@/entities/invoice';
import { updateInvoiceDiscount, invoiceQueries } from '@/entities/invoice';

interface UseUpdateInvoiceDiscountOptions {
  onSuccess?: (result: { id: number; message: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for updating the discount amount on a DRAFT invoice.
 * Invalidates invoice queries on success.
 */
export function useUpdateInvoiceDiscount(
  options: UseUpdateInvoiceDiscountOptions = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateInvoiceDiscountInput) =>
      updateInvoiceDiscount(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: invoiceQueries.all() });
      options.onSuccess?.(result);
    },
    onError: (error) => {
      options.onError?.(error as Error);
    },
  });
}
