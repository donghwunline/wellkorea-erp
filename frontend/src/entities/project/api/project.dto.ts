/**
 * Project DTOs.
 *
 * Data Transfer Objects matching backend API responses.
 *
 * FSD Layer: entities/project/api
 */

import type { ProjectStatus } from '../model';

/**
 * Project details DTO from backend ProjectDetailView.
 */
export interface ProjectDetailsDTO {
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
}

/**
 * Project list item DTO from backend ProjectSummaryView.
 */
export interface ProjectListItemDTO {
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
 * Command result DTO from backend.
 */
export interface ProjectCommandResultDTO {
  id: number;
  message: string;
  jobCode: string | null;
}

/**
 * Request DTO for creating a new project.
 */
export interface CreateProjectRequestDTO {
  customerId: number;
  projectName: string;
  requesterName?: string;
  dueDate: string;
  internalOwnerId: number;
}

/**
 * Request DTO for updating an existing project.
 */
export interface UpdateProjectRequestDTO {
  projectName?: string;
  requesterName?: string;
  dueDate?: string;
  status?: ProjectStatus;
}

/**
 * Query parameters for listing projects.
 */
export interface ProjectListParamsDTO {
  page?: number;
  size?: number;
  search?: string;
  status?: ProjectStatus;
}
