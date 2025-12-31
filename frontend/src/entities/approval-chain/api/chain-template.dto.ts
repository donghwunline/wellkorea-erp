/**
 * Chain Template DTOs.
 *
 * Data Transfer Objects for API communication.
 */

import type { EntityType } from '@/entities/approval';

/**
 * Chain level DTO from API.
 */
export interface ChainLevelDTO {
  id: number;
  levelOrder: number;
  levelName: string;
  approverUserId: number;
  approverUserName: string;
  isRequired: boolean;
}

/**
 * Chain template DTO from API.
 */
export interface ChainTemplateDTO {
  id: number;
  entityType: EntityType;
  name: string;
  description: string | null;
  isActive: boolean;
  levels: ChainLevelDTO[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Request DTO for creating/updating a chain level.
 */
export interface ChainLevelRequestDTO {
  levelOrder: number;
  levelName: string;
  approverUserId: number;
  isRequired: boolean;
}

/**
 * Request DTO for updating chain levels.
 */
export interface UpdateChainLevelsRequestDTO {
  levels: ChainLevelRequestDTO[];
}

/**
 * Command result from API.
 */
export interface CommandResultDTO {
  id: number;
  message: string;
}
