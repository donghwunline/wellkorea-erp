/**
 * Create invoice mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvoice, invoiceQueries } from '@/entities/invoice';
import type { CreateInvoiceInput } from '@/entities/invoice';

interface UseCreateInvoiceOptions {
  onSuccess?: (result: { id: number; message: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for creating a new invoice.
 * Invalidates invoice list cache on success.
 */
export function useCreateInvoice(options: UseCreateInvoiceOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
    onSuccess: result => {
      // Invalidate invoice queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: invoiceQueries.all() });
      options.onSuccess?.(result);
    },
    onError: error => {
      options.onError?.(error as Error);
    },
  });
}
