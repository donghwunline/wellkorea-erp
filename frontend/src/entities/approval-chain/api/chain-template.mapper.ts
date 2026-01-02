/**
 * Chain Template Mapper.
 *
 * Converts between DTOs and domain models.
 */

import type { ChainLevel, ChainLevelInput, ChainTemplate } from '../model/chain-template';
import type { ChainLevelDTO, ChainLevelRequestDTO, ChainTemplateDTO } from './chain-template.dto';

/**
 * Mapper for chain template entities.
 */
export const chainTemplateMapper = {
  /**
   * Map ChainLevelDTO to domain model.
   */
  toLevel(dto: ChainLevelDTO): ChainLevel {
    return {
      id: dto.id,
      levelOrder: dto.levelOrder,
      levelName: dto.levelName?.trim() ?? '',
      approverUserId: dto.approverUserId,
      approverUserName: dto.approverUserName?.trim() ?? '',
      isRequired: dto.isRequired,
    };
  },

  /**
   * Map ChainTemplateDTO to domain model.
   */
  toTemplate(dto: ChainTemplateDTO): ChainTemplate {
    return {
      id: dto.id,
      entityType: dto.entityType,
      name: dto.name?.trim() ?? '',
      description: dto.description?.trim() ?? null,
      isActive: dto.isActive,
      levels: dto.levels?.map(this.toLevel) ?? [],
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  },

  /**
   * Map ChainLevelInput to request DTO.
   */
  toLevelRequest(input: ChainLevelInput): ChainLevelRequestDTO {
    return {
      levelOrder: input.levelOrder,
      levelName: input.levelName,
      approverUserId: input.approverUserId,
      isRequired: input.isRequired,
    };
  },
};
