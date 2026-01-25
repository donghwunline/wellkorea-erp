/**
 * Issue invoice mutation hook.
 * Handles file upload and invoice issuance.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  issueInvoice,
  invoiceQueries,
  type IssueInvoiceInput,
} from '@/entities/invoice';

interface UseIssueInvoiceOptions {
  onSuccess?: (result: { id: number; message: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for issuing an invoice with document attachment (DRAFT → ISSUED).
 * Handles the 3-step upload flow and invalidates queries on success.
 */
export function useIssueInvoice(options: UseIssueInvoiceOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: IssueInvoiceInput) => issueInvoice(input),
    onSuccess: (result, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: invoiceQueries.all() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueries.detail(variables.invoiceId).queryKey,
      });
      options.onSuccess?.(result);
    },
    onError: (error) => {
      options.onError?.(error as Error);
    },
  });
}
