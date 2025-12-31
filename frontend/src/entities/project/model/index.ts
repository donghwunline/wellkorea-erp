/**
 * Project model - Public API.
 */

// Core types
export type { ProjectStatus, Project, ProjectListItem } from './project';
export { ProjectStatusConfig, PROJECT_STATUS_LABELS, projectRules } from './project';

// Section/KPI types (for navigation grid)
export type {
  ProjectSection,
  ProjectSectionSummary,
  ProjectSectionsSummary,
  ProjectKPI,
} from './project';

// Command types and validation
export type { CreateProjectCommand, UpdateProjectCommand } from './project-command';
export { projectValidation } from './project-command';
