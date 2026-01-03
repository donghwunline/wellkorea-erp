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
import { chainTemplateMapper } from './chain-template.mapper';
import { getChainTemplates, getChainTemplate } from './get-chain-template';

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
        const responses = await getChainTemplates();
        return responses.map(chainTemplateMapper.toTemplate);
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
        const response = await getChainTemplate(id);
        return chainTemplateMapper.toTemplate(response);
      },
      enabled: id > 0,
    }),
};
