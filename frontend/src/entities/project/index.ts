/**
 * Project Entity - Public API.
 *
 * Domain models, business rules, API functions, and query hooks for projects.
 *
 * FSD Layer: entities
 * Can import from: shared only
 */

// ==================== MODEL ====================
// Core types
export type { ProjectStatus, Project, ProjectListItem } from './model';
export { ProjectStatusConfig, PROJECT_STATUS_LABELS, projectRules } from './model';

// Section/KPI types (for navigation grid)
export type {
  ProjectSection,
  ProjectSectionSummary,
  ProjectSectionsSummary,
  ProjectKPI,
} from './model';

// Command types and validation
export type { CreateProjectCommand, UpdateProjectCommand } from './model';
export { projectValidation } from './model';

// ==================== API ====================
// API functions
export { projectApi, projectSummaryApi } from './api';

// Mappers
export { projectMapper, projectCommandMapper } from './api';
export type { ProjectCommandResult, CreateProjectInput, UpdateProjectInput } from './api';

// DTOs (for type compatibility if needed)
export type {
  ProjectDetailsDTO,
  ProjectListItemDTO,
  ProjectCommandResultDTO,
  CreateProjectRequestDTO,
  UpdateProjectRequestDTO,
  ProjectListParamsDTO,
} from './api';

// Legacy type aliases for backward compatibility
/** @deprecated Use CreateProjectInput or CreateProjectRequestDTO instead */
export type { CreateProjectRequestDTO as CreateProjectRequest } from './api';
/** @deprecated Use UpdateProjectInput or UpdateProjectRequestDTO instead */
export type { UpdateProjectRequestDTO as UpdateProjectRequest } from './api';
/** @deprecated Use ProjectListParamsDTO instead */
export type { ProjectListParamsDTO as ProjectListParams } from './api';

// ==================== QUERY ====================
export {
  projectQueryKeys,
  projectQueryFns,
  useProject,
  type UseProjectOptions,
  type UseProjectReturn,
} from './query';
