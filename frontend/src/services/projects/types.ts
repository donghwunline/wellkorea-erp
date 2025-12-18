/**
 * Project service types.
 *
 * API DTOs are defined here matching backend ProjectResponse and request DTOs.
 */

import type { Paginated } from '@/api/types';

/**
 * Project lifecycle status.
 */
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

/**
 * Project status display labels.
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

/**
 * Full project details from API response.
 */
export interface ProjectDetails {
  id: number;
  jobCode: string;
  customerId: number;
  projectName: string;
  requesterName: string | null;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  internalOwnerId: number;
  status: ProjectStatus;
  createdById: number;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * Request DTO for creating a new project.
 */
export interface CreateProjectRequest {
  customerId: number;
  projectName: string;
  requesterName?: string;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  internalOwnerId: number;
}

/**
 * Request DTO for updating an existing project.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateProjectRequest {
  projectName?: string;
  requesterName?: string;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  status?: ProjectStatus;
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

/**
 * Paginated project list response.
 */
export type PaginatedProjects = Paginated<ProjectDetails>;
