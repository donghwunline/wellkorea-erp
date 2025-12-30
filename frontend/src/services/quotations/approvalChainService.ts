/**
 * Approval chain configuration service.
 * Business logic layer for admin approval chain operations.
 *
 * Features:
 * - List chain templates
 * - Get chain template details
 * - Update chain levels
 */

import { httpClient, APPROVAL_CHAIN_ENDPOINTS } from '@/shared/api';
import type { ChainLevelRequest, ChainTemplate, CommandResult, UpdateChainLevelsRequest } from './types';

/**
 * Transform ChainTemplate DTO.
 * Normalizes data from API response.
 */
function transformChainTemplate(dto: ChainTemplate): ChainTemplate {
  return {
    ...dto,
    name: dto.name?.trim() ?? '',
    description: dto.description?.trim() ?? null,
    levels: dto.levels?.map(level => ({
      ...level,
      levelName: level.levelName?.trim() ?? '',
      approverUserName: level.approverUserName?.trim() ?? '',
    })) ?? [],
  };
}

/**
 * Approval chain configuration service (Admin only).
 */
export const approvalChainService = {
  /**
   * Get all approval chain templates.
   */
  async getChainTemplates(): Promise<ChainTemplate[]> {
    const templates = await httpClient.get<ChainTemplate[]>(APPROVAL_CHAIN_ENDPOINTS.BASE);
    return templates.map(transformChainTemplate);
  },

  /**
   * Get chain template by ID.
   */
  async getChainTemplate(id: number): Promise<ChainTemplate> {
    const template = await httpClient.get<ChainTemplate>(APPROVAL_CHAIN_ENDPOINTS.byId(id));
    return transformChainTemplate(template);
  },

  /**
   * Update chain levels for a template.
   * CQRS: Returns command result - fetch fresh data via getChainTemplate() if needed.
   */
  async updateChainLevels(id: number, levels: ChainLevelRequest[]): Promise<CommandResult> {
    const request: UpdateChainLevelsRequest = { levels };
    return httpClient.put<CommandResult>(APPROVAL_CHAIN_ENDPOINTS.levels(id), request);
  },
};
