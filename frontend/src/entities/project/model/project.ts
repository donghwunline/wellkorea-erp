/**
 * Project domain model.
 *
 * Domain types and business rules for projects.
 *
 * FSD Layer: entities/project/model
 * Can import from: shared only
 */

/**
 * Project lifecycle status.
 */
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

/**
 * Project status display configuration.
 */
export const ProjectStatusConfig: Record<ProjectStatus, {
  label: string;
  labelKo: string;
  color: 'default' | 'info' | 'success' | 'warning';
}> = {
  DRAFT: { label: 'Draft', labelKo: '초안', color: 'default' },
  ACTIVE: { label: 'Active', labelKo: '진행중', color: 'info' },
  COMPLETED: { label: 'Completed', labelKo: '완료', color: 'success' },
  ARCHIVED: { label: 'Archived', labelKo: '보관', color: 'warning' },
};

/**
 * Full project details (from ProjectDetailView).
 * Includes resolved names for customer, internal owner, and created by user.
 */
export interface Project {
  readonly id: number;
  readonly jobCode: string;
  readonly customerId: number;
  readonly customerName: string | null;
  readonly projectName: string;
  readonly requesterName: string | null;
  readonly dueDate: string; // ISO date string (YYYY-MM-DD)
  readonly internalOwnerId: number;
  readonly internalOwnerName: string | null;
  readonly status: ProjectStatus;
  readonly createdById: number;
  readonly createdByName: string | null;
  readonly createdAt: string; // ISO datetime string
  readonly updatedAt: string; // ISO datetime string
}

/**
 * Project summary for list views (from ProjectSummaryView).
 * Optimized for pagination - includes essential fields.
 */
export interface ProjectSummary {
  readonly id: number;
  readonly jobCode: string;
  readonly customerId: number;
  readonly customerName: string | null;
  readonly projectName: string;
  readonly dueDate: string;
  readonly status: ProjectStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Project business rules.
 * Pure functions for project-related logic.
 */
export const projectRules = {
  /**
   * Check if project can be edited.
   */
  canEdit(project: Project | ProjectSummary): boolean {
    return project.status === 'DRAFT' || project.status === 'ACTIVE';
  },

  /**
   * Check if project can be archived.
   */
  canArchive(project: Project | ProjectSummary): boolean {
    return project.status === 'COMPLETED';
  },

  /**
   * Get status display label.
   */
  getStatusLabel(status: ProjectStatus, korean = false): string {
    const config = ProjectStatusConfig[status];
    return korean ? config.labelKo : config.label;
  },
};
