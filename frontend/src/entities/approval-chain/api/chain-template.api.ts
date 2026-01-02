/**
 * Chain Template API.
 *
 * Low-level API functions for approval chain templates.
 */

import { httpClient, APPROVAL_CHAIN_ENDPOINTS } from '@/shared/api';
import type { ChainLevelInput, ChainTemplate } from '../model/chain-template';
import type { ChainTemplateDTO, UpdateChainLevelsRequestDTO } from './chain-template.dto';
import { chainTemplateMapper } from './chain-template.mapper';

/**
 * Command result from chain operations.
 */
export interface ChainCommandResult {
  id: number;
  message: string;
}

/**
 * Approval chain template API.
 */
export const chainTemplateApi = {
  /**
   * Get all approval chain templates.
   */
  async getAll(): Promise<ChainTemplate[]> {
    const dtos = await httpClient.get<ChainTemplateDTO[]>(APPROVAL_CHAIN_ENDPOINTS.BASE);
    return dtos.map(dto => chainTemplateMapper.toTemplate(dto));
  },

  /**
   * Get chain template by ID.
   */
  async getById(id: number): Promise<ChainTemplate> {
    const dto = await httpClient.get<ChainTemplateDTO>(APPROVAL_CHAIN_ENDPOINTS.byId(id));
    return chainTemplateMapper.toTemplate(dto);
  },

  /**
   * Update chain levels for a template.
   */
  async updateLevels(id: number, levels: ChainLevelInput[]): Promise<ChainCommandResult> {
    const request: UpdateChainLevelsRequestDTO = {
      levels: levels.map(l => chainTemplateMapper.toLevelRequest(l)),
    };
    return httpClient.put<ChainCommandResult>(APPROVAL_CHAIN_ENDPOINTS.levels(id), request);
  },
};
