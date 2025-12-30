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
 * Project summary DTO from backend ProjectSummaryView.
 */
export interface ProjectSummaryDTO {
  id: number;
  jobCode: string;
  customerId: number;
  customerName: string | null;
  projectName: string;
  dueDate: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}
