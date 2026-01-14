/**
 * Record payment mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordPayment, invoiceQueries, arReportQueries } from '@/entities/invoice';
import type { RecordPaymentInput } from '@/entities/invoice';

interface PaymentResult {
  id: number | null;
  invoiceId: number;
  remainingBalance: number;
  message: string;
}

interface UseRecordPaymentOptions {
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for recording a payment against an invoice.
 * Invalidates invoice and AR report caches on success.
 */
export function useRecordPayment(options: UseRecordPaymentOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordPaymentInput) => recordPayment(input),
    onSuccess: (result, input) => {
      // Invalidate invoice queries
      queryClient.invalidateQueries({ queryKey: invoiceQueries.all() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueries.detail(input.invoiceId).queryKey
      });
      // Invalidate AR report since payment affects aging
      queryClient.invalidateQueries({ queryKey: arReportQueries.all() });
      options.onSuccess?.(result);
    },
    onError: error => {
      options.onError?.(error as Error);
    },
  });
}
