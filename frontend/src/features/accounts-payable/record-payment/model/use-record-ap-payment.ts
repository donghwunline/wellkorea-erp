/**
 * Record AP (vendor) payment mutation hook.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  recordPayment,
  accountsPayableQueries,
} from '@/entities/accounts-payable';
import type { RecordPaymentInput, RecordPaymentResult } from '@/entities/accounts-payable';

interface UseRecordAPPaymentOptions {
  onSuccess?: (result: RecordPaymentResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for recording a payment against an accounts payable (vendor payment).
 * Invalidates AP caches on success.
 */
export function useRecordAPPayment(options: UseRecordAPPaymentOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { apId: number; input: RecordPaymentInput }) =>
      recordPayment(params.apId, params.input),
    onSuccess: result => {
      // Invalidate all AP queries to refresh data
      queryClient.invalidateQueries({ queryKey: accountsPayableQueries.lists() });
      queryClient.invalidateQueries({
        queryKey: accountsPayableQueries.detail(result.accountsPayableId).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: accountsPayableQueries.aging().queryKey,
      });
      options.onSuccess?.(result);
    },
    onError: error => {
      options.onError?.(error as Error);
    },
  });
}
