/**
 * Project API - Public API.
 */

// API functions
export { projectApi } from './project.api';
export { projectSummaryApi } from './project-summary.api';

// Mappers
export { projectMapper } from './project.mapper';
export type { ProjectCommandResult } from './project.mapper';
export { projectCommandMapper } from './project.command-mapper';
export type { CreateProjectInput, UpdateProjectInput } from './project.command-mapper';

// DTOs
export type {
  ProjectDetailsDTO,
  ProjectListItemDTO,
  ProjectCommandResultDTO,
  CreateProjectRequestDTO,
  UpdateProjectRequestDTO,
  ProjectListParamsDTO,
} from './project.dto';
