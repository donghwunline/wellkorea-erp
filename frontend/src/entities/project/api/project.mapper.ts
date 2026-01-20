/**
 * Project Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 */

import type { Project, ProjectListItem, ProjectStatus } from '../model/project';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Command result from CQRS command endpoints.
 * Project commands include auto-generated jobCode.
 */
export interface CommandResult {
  id: number;
  message: string;
  jobCode: string | null;
}

/**
 * Project details from API response.
 */
export interface ProjectDetailsResponse {
  id: number;
  jobCode: string;
  customerId: number;
  customerName: string | null;
  projectName: string;
  requesterName: string | null;
  dueDate: string;
  internalOwnerId: number;
  internalOwnerName: string | null;
  status: ProjectStatus;
  createdById: number;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  note: string | null;
}

/**
 * Project list item from API response.
 */
export interface ProjectListItemResponse {
  id: number;
  jobCode: string;
  customerId: number;
  customerName: string | null;
  projectName: string;
  requesterName: string | null;
  dueDate: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Query parameters for listing projects.
 */
export interface ProjectListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: ProjectStatus;
}

// =============================================================================
// MAPPERS
// =============================================================================

/**
 * Project mapper.
 */
export const projectMapper = {
  /**
   * Transform ProjectDetailsResponse to Project domain model.
   */
  toDomain(response: ProjectDetailsResponse): Project {
    return {
      id: response.id,
      jobCode: response.jobCode,
      customerId: response.customerId,
      customerName: response.customerName,
      projectName: response.projectName?.trim() ?? '',
      requesterName: response.requesterName?.trim() ?? null,
      dueDate: response.dueDate,
      internalOwnerId: response.internalOwnerId,
      internalOwnerName: response.internalOwnerName,
      status: response.status,
      createdById: response.createdById,
      createdByName: response.createdByName,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      note: response.note,
    };
  },

  /**
   * Transform ProjectListItemResponse to ProjectListItem domain model.
   */
  toListItem(response: ProjectListItemResponse): ProjectListItem {
    return {
      id: response.id,
      jobCode: response.jobCode,
      customerId: response.customerId,
      customerName: response.customerName,
      projectName: response.projectName?.trim() ?? '',
      requesterName: response.requesterName?.trim() ?? null,
      dueDate: response.dueDate,
      status: response.status,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  },
};
