/**
 * Projects service barrel export.
 */

export { projectService } from './projectService';
export { projectSummaryService } from './projectSummaryService';
export type {
  CreateProjectRequest,
  PaginatedProjects,
  ProjectDetails,
  ProjectListParams,
  ProjectStatus,
  UpdateProjectRequest,
  // Project summary types
  ProjectSection,
  ProjectSectionSummary,
  ProjectSummary,
} from './types';
export { PROJECT_STATUS_LABELS } from './types';
