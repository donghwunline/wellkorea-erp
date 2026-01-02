/**
 * Chain Template Query Factory.
 *
 * TanStack Query v5 query options factory.
 * Use with useQuery() directly - no custom hooks needed.
 *
 * @example
 * ```typescript
 * // List all chain templates
 * const { data } = useQuery(chainTemplateQueries.list());
 *
 * // Get chain template detail
 * const { data } = useQuery(chainTemplateQueries.detail(id));
 * ```
 */

import { queryOptions } from '@tanstack/react-query';
import type { ChainTemplate } from '../model/chain-template';
import { chainTemplateApi } from './chain-template.api';

// =============================================================================
// Query Factory
// =============================================================================

export const chainTemplateQueries = {
  // -------------------------------------------------------------------------
  // Query Keys
  // -------------------------------------------------------------------------

  /** Base key for all chain template queries */
  all: () => ['chain-templates'] as const,

  /** Key for chain template list queries */
  lists: () => [...chainTemplateQueries.all(), 'list'] as const,

  /** Key for chain template detail queries */
  details: () => [...chainTemplateQueries.all(), 'detail'] as const,

  // -------------------------------------------------------------------------
  // Chain Template List Query
  // -------------------------------------------------------------------------

  /**
   * Query options for all chain templates.
   */
  list: () =>
    queryOptions({
      queryKey: [...chainTemplateQueries.lists()] as const,
      queryFn: async (): Promise<ChainTemplate[]> => {
        return chainTemplateApi.getAll();
      },
    }),

  // -------------------------------------------------------------------------
  // Chain Template Detail Query
  // -------------------------------------------------------------------------

  /**
   * Query options for chain template detail.
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...chainTemplateQueries.details(), id] as const,
      queryFn: async (): Promise<ChainTemplate> => {
        return chainTemplateApi.getById(id);
      },
      enabled: id > 0,
    }),
};
