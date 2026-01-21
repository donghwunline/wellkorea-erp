/**
 * Project domain model.
 *
 * Domain types and business rules for projects.
 *
 * FSD Layer: entities/project/model
 * Can import from: shared only
 */

// ============================================================================
// Core Project Types
// ============================================================================

/**
 * Project lifecycle status.
 */
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

/**
 * Project status display configuration.
 */
export const ProjectStatusConfig: Record<
  ProjectStatus,
  {
    label: string;
    labelKo: string;
    color: 'default' | 'info' | 'success' | 'warning';
  }
> = {
  DRAFT: { label: 'Draft', labelKo: '초안', color: 'default' },
  ACTIVE: { label: 'Active', labelKo: '진행중', color: 'info' },
  COMPLETED: { label: 'Completed', labelKo: '완료', color: 'success' },
  ARCHIVED: { label: 'Archived', labelKo: '보관', color: 'warning' },
};

/**
 * Legacy status labels for backward compatibility.
 * @deprecated Use ProjectStatusConfig instead
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
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
  readonly note: string | null;
}

/**
 * Project list item for paginated views (from ProjectSummaryView).
 * Optimized for pagination - includes essential fields.
 */
export interface ProjectListItem {
  readonly id: number;
  readonly jobCode: string;
  readonly customerId: number;
  readonly customerName: string | null;
  readonly projectName: string;
  readonly requesterName: string | null;
  readonly dueDate: string;
  readonly status: ProjectStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ============================================================================
// Project Section Types (for Navigation Grid)
// ============================================================================

/**
 * Project section identifiers for navigation.
 */
export type ProjectSection =
  | 'quotation'
  | 'process'
  | 'purchase'
  | 'outsource'
  | 'documents'
  | 'delivery'
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
 * Full project sections summary with all sections.
 */
export interface ProjectSectionsSummary {
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
  /** Accounts receivable amount (KRW) - outstanding unpaid invoices */
  accountsReceivable: number;
  /** Total invoiced amount (KRW) - all issued invoices */
  invoicedAmount: number;
}

// ============================================================================
// Business Rules
// ============================================================================

/**
 * Project business rules.
 * Pure functions for project-related logic.
 */
export const projectRules = {
  /**
   * Check if project can be edited.
   */
  canEdit(project: Project | ProjectListItem): boolean {
    return project.status === 'DRAFT' || project.status === 'ACTIVE';
  },

  /**
   * Check if project can be archived.
   */
  canArchive(project: Project | ProjectListItem): boolean {
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
