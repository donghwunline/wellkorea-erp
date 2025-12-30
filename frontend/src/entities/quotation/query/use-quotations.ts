/**
 * Paginated quotation list query hook.
 *
 * Fetches and caches a paginated list of quotations.
 * Returns domain models (not DTOs).
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { QuotationStatus } from '../model';
import { quotationQueryKeys } from './query-keys';
import { quotationQueryFns, type PaginatedQuotations } from './query-fns';

/**
 * Parameters for useQuotations hook.
 */
export interface UseQuotationsParams {
  /**
   * Page number (0-indexed).
   */
  page: number;

  /**
   * Page size. Default: 10
   */
  size?: number;

  /**
   * Search term. Default: ''
   */
  search?: string;

  /**
   * Status filter. Default: null (all)
   */
  status?: QuotationStatus | null;

  /**
   * Project ID filter. Default: null (all)
   */
  projectId?: number | null;
}

/**
 * Hook options for useQuotations.
 */
export interface UseQuotationsOptions
  extends Omit<
      UseQueryOptions<
        PaginatedQuotations,
        Error,
        PaginatedQuotations,
        ReturnType<typeof quotationQueryKeys.list>
      >,
      'queryKey' | 'queryFn'
    >,
    UseQuotationsParams {}

/**
 * Hook for fetching paginated quotation list.
 *
 * Features:
 * - Auto-caches result with TanStack Query
 * - Returns domain models with business rules
 * - Deduplicates concurrent requests
 * - Supports filtering and pagination
 *
 * @param options - Hook options with pagination/filter params
 *
 * @example
 * ```tsx
 * function QuotationList() {
 *   const [page, setPage] = useState(0);
 *   const [search, setSearch] = useState('');
 *   const [status, setStatus] = useState<QuotationStatus | null>(null);
 *
 *   const { data, isLoading, error } = useQuotations({
 *     page,
 *     search,
 *     status,
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *
 *   return (
 *     <QuotationTable
 *       data={data?.data ?? []}
 *       pagination={data}
 *       onPageChange={setPage}
 *     />
 *   );
 * }
 * ```
 */
export function useQuotations({
  page,
  size = 10,
  search = '',
  status = null,
  projectId = null,
  ...options
}: UseQuotationsOptions) {
  // Normalize optional params to prevent undefined in queryKey
  const normalizedParams = {
    page,
    size,
    search: search.trim(),
    status,
    projectId,
  };

  return useQuery({
    queryKey: quotationQueryKeys.list(
      normalizedParams.page,
      normalizedParams.size,
      normalizedParams.search,
      normalizedParams.status,
      normalizedParams.projectId
    ),
    queryFn: quotationQueryFns.list(normalizedParams),
    ...options,
  });
}
