/**
 * Projects feature components barrel export.
 *
 * @deprecated This module is deprecated. Import from:
 * - '@/entities/project' for display components (ProjectTable, ProjectDetailsCard, etc.)
 * - '@/features/project/form' for ProjectForm
 * - '@/features/project/create' for useCreateProject, JobCodeSuccessModal
 * - '@/features/project/update' for useUpdateProject
 * - '@/widgets' for ProjectRelatedNavigationGrid
 *
 * This file re-exports for backward compatibility and will be removed after full migration.
 */

// =============================================================================
// RE-EXPORTS FROM ENTITIES (new location)
// =============================================================================

/** @deprecated Import from '@/entities/project' instead */
export { ProjectTable, type ProjectTableProps } from '@/entities/project';

/** @deprecated Import from '@/entities/project' instead */
export { ProjectDetailsCard, type ProjectDetailsCardProps } from '@/entities/project';

/** @deprecated Import from '@/entities/project' instead */
export { ProjectSummaryCard, type ProjectSummaryCardProps } from '@/entities/project';

/** @deprecated Import from '@/entities/project' instead */
export { ProjectKPIStrip, ProjectKPIStripSkeleton, type ProjectKPIStripProps } from '@/entities/project';

// =============================================================================
// RE-EXPORTS FROM FEATURES (new location)
// =============================================================================

/** @deprecated Import from '@/features/project/form' instead */
export { ProjectForm, type ProjectFormProps } from '@/features/project/form';

/** @deprecated Import from '@/features/project/create' instead */
export { JobCodeSuccessModal, type JobCodeSuccessModalProps } from '@/features/project/create';

// =============================================================================
// RE-EXPORTS FROM WIDGETS (new location)
// =============================================================================

/** @deprecated Import from '@/widgets' instead */
export { ProjectRelatedNavigationGrid, type ProjectRelatedNavigationGridProps } from '@/widgets';
