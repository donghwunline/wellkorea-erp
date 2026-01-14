/**
 * Issue invoice mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueInvoice, invoiceQueries } from '@/entities/invoice';

interface UseIssueInvoiceOptions {
  onSuccess?: (result: { id: number; message: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for issuing an invoice (DRAFT → ISSUED).
 * Invalidates invoice cache on success.
 */
export function useIssueInvoice(options: UseIssueInvoiceOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: number) => issueInvoice(invoiceId),
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
