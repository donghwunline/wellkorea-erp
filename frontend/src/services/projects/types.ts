/**
 * Project service types.
 *
 * API DTOs are defined here matching backend ProjectResponse and request DTOs.
 */

import type { Paginated } from '@/shared/api/types';

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
 * Full project details from API response (ProjectDetailView).
 * Includes resolved names for customer, internal owner, and created by user.
 */
export interface ProjectDetails {
  id: number;
  jobCode: string;
  customerId: number;
  customerName: string | null;
  projectName: string;
  requesterName: string | null;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  internalOwnerId: number;
  internalOwnerName: string | null;
  status: ProjectStatus;
  createdById: number;
  createdByName: string | null;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * Project summary for list views (ProjectSummaryView).
 * Optimized for pagination - includes essential fields and customer name.
 */
export interface ProjectListItem {
  id: number;
  jobCode: string;
  customerId: number;
  customerName: string | null;
  projectName: string;
  requesterName: string | null;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  status: ProjectStatus;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * Command result for project create/update operations.
 * For create operations, includes the generated jobCode.
 */
export interface ProjectCommandResult {
  id: number;
  message: string;
  /** Generated jobCode (only present for create operations) */
  jobCode: string | null;
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
export type PaginatedProjects = Paginated<ProjectListItem>;

// ============================================================================
// Project Summary Types (for Navigation Grid)
// ============================================================================

/**
 * Project section identifiers for navigation.
 */
export type ProjectSection =
  | 'quotation'
  | 'process'
  | 'outsource'
  | 'delivery'
  | 'documents'
  | 'finance';

/**
 * Summary statistics for a single project section.
 */
export interface ProjectSectionSummary {
  /** Section identifier */
  section: ProjectSection;
  /** Display label for the section */
  label: string;
  /** Total count (quotations, work items, deliveries, etc.) */
  totalCount: number;
  /** Pending/in-progress count */
  pendingCount: number;
  /** Optional progress percentage (0-100) */
  progressPercent?: number;
  /** Optional monetary value (for quotation total, finance AR/AP) */
  value?: number;
  /** Last updated timestamp */
  lastUpdated: string | null;
}

/**
 * Full project summary with all sections.
 */
export interface ProjectSummary {
  projectId: number;
  sections: ProjectSectionSummary[];
}

// ============================================================================
// Project KPI Types (for Dashboard Strip)
// ============================================================================

/**
 * Key performance indicators for a project.
 * Displayed in the KPI strip at the top of the project hub page.
 */
export interface ProjectKPI {
  /** Overall progress percentage (0-100) */
  progressPercent: number;
  /** Number of pending approval requests */
  pendingApprovals: number;
  /** Number of missing required documents */
  missingDocuments: number;
  /** Accounts receivable amount (KRW) */
  accountsReceivable: number;
}
