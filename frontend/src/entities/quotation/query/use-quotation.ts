/**
 * Single quotation query hook.
 *
 * Fetches and caches a single quotation by ID.
 * Returns domain model (not DTO).
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { Quotation } from '../model';
import { quotationQueryKeys } from './query-keys';
import { quotationQueryFns } from './query-fns';

/**
 * Hook options for useQuotation.
 */
export interface UseQuotationOptions extends Omit<
  UseQueryOptions<Quotation, Error, Quotation, ReturnType<typeof quotationQueryKeys.detail>>,
  'queryKey' | 'queryFn'
> {
  /**
   * Quotation ID to fetch.
   */
  id: number;
}

/**
 * Hook for fetching a single quotation.
 *
 * Features:
 * - Auto-caches result with TanStack Query
 * - Returns domain model with business rules
 * - Deduplicates concurrent requests
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * function QuotationDetail({ id }: { id: number }) {
 *   const { data: quotation, isLoading, error } = useQuotation({ id });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!quotation) return null;
 *
 *   // Use domain rules
 *   const canEdit = quotationRules.canEdit(quotation);
 *   const total = quotationRules.getFormattedTotal(quotation);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useQuotation({ id, ...options }: UseQuotationOptions) {
  return useQuery({
    queryKey: quotationQueryKeys.detail(id),
    queryFn: quotationQueryFns.detail(id),
    ...options,
  });
}
