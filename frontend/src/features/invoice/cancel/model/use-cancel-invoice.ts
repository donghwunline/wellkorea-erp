/**
 * Cancel invoice mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelInvoice, invoiceQueries } from '@/entities/invoice';

interface UseCancelInvoiceOptions {
  onSuccess?: (result: { id: number; message: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for cancelling an invoice.
 * Invalidates invoice cache on success.
 */
export function useCancelInvoice(options: UseCancelInvoiceOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: number) => cancelInvoice(invoiceId),
    onSuccess: (result, invoiceId) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: invoiceQueries.all() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueries.detail(invoiceId).queryKey
      });
      options.onSuccess?.(result);
    },
    onError: error => {
      options.onError?.(error as Error);
    },
  });
}
