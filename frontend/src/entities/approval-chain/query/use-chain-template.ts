/**
 * Chain Template Query Hook.
 *
 * Fetches and caches a single chain template by ID.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ChainTemplate } from '../model';
import { chainTemplateQueryKeys } from './query-keys';
import { chainTemplateQueryFns } from './query-fns';

/**
 * Hook options for useChainTemplate.
 */
export type UseChainTemplateOptions = Omit<
  UseQueryOptions<ChainTemplate, Error, ChainTemplate, ReturnType<typeof chainTemplateQueryKeys.detail>>,
  'queryKey' | 'queryFn'
>;

/**
 * Hook for fetching a single chain template.
 *
 * @param id - Chain template ID
 * @param options - Query options
 *
 * @example
 * ```tsx
 * function ChainTemplateDetail({ id }: { id: number }) {
 *   const { data: template, isLoading, error } = useChainTemplate(id);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!template) return null;
 *
 *   return <div>{template.name}</div>;
 * }
 * ```
 */
export function useChainTemplate(id: number, options: UseChainTemplateOptions = {}) {
  return useQuery({
    queryKey: chainTemplateQueryKeys.detail(id),
    queryFn: chainTemplateQueryFns.detail(id),
    enabled: id > 0,
    ...options,
  });
}
