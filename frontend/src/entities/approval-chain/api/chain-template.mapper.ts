/**
 * Chain Template Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 */

import type { EntityType } from '@/shared/domain';
import type { ChainLevel, ChainTemplate } from '../model/chain-template';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Command result from CQRS command endpoints.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Chain level from API response.
 */
export interface ChainLevelResponse {
  id: number;
  levelOrder: number;
  levelName: string;
  approverUserId: number;
  approverUserName: string;
  isRequired: boolean;
}

/**
 * Chain template from API response.
 */
export interface ChainTemplateResponse {
  id: number;
  entityType: EntityType;
  name: string;
  description: string | null;
  isActive: boolean;
  levels: ChainLevelResponse[];
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// MAPPERS
// =============================================================================

/**
 * Mapper for chain template entities.
 */
export const chainTemplateMapper = {
  /**
   * Map ChainLevelResponse to domain model.
   */
  toLevel(response: ChainLevelResponse): ChainLevel {
    return {
      id: response.id,
      levelOrder: response.levelOrder,
      levelName: response.levelName?.trim() ?? '',
      approverUserId: response.approverUserId,
      approverUserName: response.approverUserName?.trim() ?? '',
      isRequired: response.isRequired,
    };
  },

  /**
   * Map ChainTemplateResponse to domain model.
   */
  toTemplate(response: ChainTemplateResponse): ChainTemplate {
    return {
      id: response.id,
      entityType: response.entityType,
      name: response.name?.trim() ?? '',
      description: response.description?.trim() ?? null,
      isActive: response.isActive,
      levels: response.levels?.map(l => chainTemplateMapper.toLevel(l)) ?? [],
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  },
};
