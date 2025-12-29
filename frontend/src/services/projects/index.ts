/**
 * Projects service barrel export.
 */

export { projectService } from './projectService';
export { projectSummaryService } from './projectSummaryService';
export type {
  CreateProjectRequest,
  PaginatedProjects,
  ProjectCommandResult,
  ProjectDetails,
  ProjectListItem,
  ProjectListParams,
  ProjectStatus,
  UpdateProjectRequest,
  // Project summary types
  ProjectSection,
  ProjectSectionSummary,
  ProjectSummary,
  // Project KPI types
  ProjectKPI,
} from './types';
export { PROJECT_STATUS_LABELS } from './types';
