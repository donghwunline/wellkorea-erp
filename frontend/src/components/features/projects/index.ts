/**
 * Projects feature components barrel export.
 */

export { ProjectTable } from './ProjectTable';
export type { ProjectTableProps } from './ProjectTable';

export { ProjectForm } from './ProjectForm';
export type { ProjectFormProps } from './ProjectForm';

export { ProjectDetailsCard } from './ProjectDetailsCard';
export type { ProjectDetailsCardProps } from './ProjectDetailsCard';

export { JobCodeSuccessModal } from './JobCodeSuccessModal';
export type { JobCodeSuccessModalProps } from './JobCodeSuccessModal';

export { ProjectSummaryCard } from './ProjectSummaryCard';
export type { ProjectSummaryCardProps } from './ProjectSummaryCard';

export { ProjectRelatedNavigationGrid } from './ProjectRelatedNavigationGrid';
export type { ProjectRelatedNavigationGridProps } from './ProjectRelatedNavigationGrid';

export { ProjectKPIStrip } from './ProjectKPIStrip';
export type { ProjectKPIStripProps } from './ProjectKPIStrip';

// Hooks
export { useProjectSummary } from './hooks';
export type { UseProjectSummaryOptions, UseProjectSummaryReturn } from './hooks';

// Legacy exports (deprecated - will be removed in future version)
// useProjectActions has been replaced by:
// - projectQueries from '@/entities/project' (for queries)
// - useCreateProject, useUpdateProject from '@/features/project' (for mutations)
