/**
 * Project mappers.
 *
 * Transforms DTOs to domain models.
 *
 * FSD Layer: entities/project/api
 */

import type { Project, ProjectListItem } from '../model';
import type { ProjectDetailsDTO, ProjectListItemDTO, ProjectCommandResultDTO } from './project.dto';

/**
 * Project command result (mapped from DTO).
 */
export interface ProjectCommandResult {
  readonly id: number;
  readonly message: string;
  readonly jobCode: string | null;
}

/**
 * Project mapper.
 */
export const projectMapper = {
  /**
   * Transform ProjectDetailsDTO to Project domain model.
   */
  toDomain(dto: ProjectDetailsDTO): Project {
    return {
      id: dto.id,
      jobCode: dto.jobCode,
      customerId: dto.customerId,
      customerName: dto.customerName,
      projectName: dto.projectName?.trim() ?? '',
      requesterName: dto.requesterName?.trim() ?? null,
      dueDate: dto.dueDate,
      internalOwnerId: dto.internalOwnerId,
      internalOwnerName: dto.internalOwnerName,
      status: dto.status,
      createdById: dto.createdById,
      createdByName: dto.createdByName,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  },

  /**
   * Transform ProjectListItemDTO to ProjectListItem domain model.
   */
  toListItem(dto: ProjectListItemDTO): ProjectListItem {
    return {
      id: dto.id,
      jobCode: dto.jobCode,
      customerId: dto.customerId,
      customerName: dto.customerName,
      projectName: dto.projectName?.trim() ?? '',
      requesterName: dto.requesterName?.trim() ?? null,
      dueDate: dto.dueDate,
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  },

  /**
   * Transform ProjectCommandResultDTO to ProjectCommandResult.
   */
  toCommandResult(dto: ProjectCommandResultDTO): ProjectCommandResult {
    return {
      id: dto.id,
      message: dto.message,
      jobCode: dto.jobCode,
    };
  },
};
