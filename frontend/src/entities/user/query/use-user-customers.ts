/**
 * useUserCustomers query hook.
 *
 * Fetches customer assignments for a user.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { userQueryKeys } from './query-keys';
import { userQueryFns } from './query-fns';

/**
 * Options for useUserCustomers hook.
 */
export interface UseUserCustomersOptions
  extends Omit<
    UseQueryOptions<number[], Error, number[], ReturnType<typeof userQueryKeys.customers>>,
    'queryKey' | 'queryFn'
  > {
  /** User ID */
  id: number;
}

/**
 * Query hook for fetching user's customer assignments.
 *
 * @example
 * ```tsx
 * function AssignCustomersModal({ userId }: Props) {
 *   const { data: customerIds, isLoading } = useUserCustomers({ id: userId });
 *
 *   return (
 *     <CustomerSelector
 *       selectedIds={customerIds ?? []}
 *       isLoading={isLoading}
 *     />
 *   );
 * }
 * ```
 */
export function useUserCustomers({ id, ...options }: UseUserCustomersOptions) {
  return useQuery({
    queryKey: userQueryKeys.customers(id),
    queryFn: userQueryFns.customers(id),
    ...options,
  });
}
