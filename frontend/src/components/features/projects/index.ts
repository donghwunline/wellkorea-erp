/**
 * Projects feature components barrel export.
 */

export { ProjectTable } from './ProjectTable';
export type { ProjectTableProps } from './ProjectTable';

export { ProjectForm } from './ProjectForm';
export type { ProjectFormProps, SelectOption } from './ProjectForm';

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
export { useProjectActions, useProjectSummary } from './hooks';
export type { UseProjectSummaryOptions, UseProjectSummaryReturn } from './hooks';
