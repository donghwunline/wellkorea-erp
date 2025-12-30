/**
 * Project mappers.
 *
 * Transforms DTOs to domain models.
 *
 * FSD Layer: entities/project/api
 */

import type { Project, ProjectSummary } from '../model';
import type { ProjectDetailsDTO, ProjectSummaryDTO } from './project.dto';

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
   * Transform ProjectSummaryDTO to ProjectSummary domain model.
   */
  toSummary(dto: ProjectSummaryDTO): ProjectSummary {
    return {
      id: dto.id,
      jobCode: dto.jobCode,
      customerId: dto.customerId,
      customerName: dto.customerName,
      projectName: dto.projectName?.trim() ?? '',
      dueDate: dto.dueDate,
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  },
};
