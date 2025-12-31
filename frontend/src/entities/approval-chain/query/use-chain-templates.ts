/**
 * Chain Templates Query Hook.
 *
 * Fetches and caches all chain templates.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ChainTemplate } from '../model';
import { chainTemplateQueryKeys } from './query-keys';
import { chainTemplateQueryFns } from './query-fns';

/**
 * Hook options for useChainTemplates.
 */
export type UseChainTemplatesOptions = Omit<
  UseQueryOptions<ChainTemplate[], Error, ChainTemplate[], ReturnType<typeof chainTemplateQueryKeys.list>>,
  'queryKey' | 'queryFn'
>;

/**
 * Hook for fetching all chain templates.
 *
 * @example
 * ```tsx
 * function ChainTemplateList() {
 *   const { data: templates, isLoading, error } = useChainTemplates();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *
 *   return (
 *     <ul>
 *       {templates?.map(template => (
 *         <li key={template.id}>{template.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useChainTemplates(options: UseChainTemplatesOptions = {}) {
  return useQuery({
    queryKey: chainTemplateQueryKeys.list(),
    queryFn: chainTemplateQueryFns.list(),
    ...options,
  });
}
