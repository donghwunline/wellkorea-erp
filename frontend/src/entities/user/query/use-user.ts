/**
 * useUser query hook.
 *
 * Fetches a single user by ID.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { UserDetails } from '../model';
import { userQueryKeys } from './query-keys';
import { userQueryFns } from './query-fns';

/**
 * Options for useUser hook.
 */
export interface UseUserOptions
  extends Omit<
    UseQueryOptions<UserDetails, Error, UserDetails, ReturnType<typeof userQueryKeys.detail>>,
    'queryKey' | 'queryFn'
  > {
  /** User ID to fetch */
  id: number;
}

/**
 * Query hook for fetching a single user.
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: Props) {
 *   const { data: user, isLoading, error } = useUser({ id: userId });
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return <UserCard user={user} />;
 * }
 * ```
 */
export function useUser({ id, ...options }: UseUserOptions) {
  return useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: userQueryFns.detail(id),
    ...options,
  });
}
