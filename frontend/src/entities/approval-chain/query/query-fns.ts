/**
 * Chain Template Query Functions.
 *
 * Factory for TanStack Query query functions.
 */

import { chainTemplateApi } from '../api/chain-template.api';
import type { ChainTemplate } from '../model/chain-template';

/**
 * Query function factories for chain templates.
 */
export const chainTemplateQueryFns = {
  /**
   * Query function for fetching all chain templates.
   */
  list: () => async (): Promise<ChainTemplate[]> => {
    return chainTemplateApi.getAll();
  },

  /**
   * Query function for fetching a single chain template.
   */
  detail: (id: number) => async (): Promise<ChainTemplate> => {
    return chainTemplateApi.getById(id);
  },
};
