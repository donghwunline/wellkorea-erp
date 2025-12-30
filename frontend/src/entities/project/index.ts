/**
 * Project Entity - Public API.
 *
 * Domain models, business rules, API functions, and query hooks for projects.
 *
 * FSD Layer: entities
 * Can import from: shared only
 */

// Model (domain types and rules)
export {
  type ProjectStatus,
  type Project,
  type ProjectSummary,
  ProjectStatusConfig,
  projectRules,
} from './model';

// API (DTOs, mappers, HTTP functions)
export { projectApi, projectMapper } from './api';
export type { ProjectDetailsDTO, ProjectSummaryDTO } from './api';

// Query (TanStack Query hooks)
export {
  projectQueryKeys,
  projectQueryFns,
  useProject,
  type UseProjectOptions,
  type UseProjectReturn,
} from './query';
