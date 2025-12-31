/**
 * Project Entity - Public API.
 *
 * This is the ONLY entry point for importing from the project entity.
 * Internal modules (model/, api/, query/) should never be imported directly.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 *
 * @see docs/architecture/fsd-public-api-guidelines.md
 */

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type {
  Project,
  ProjectListItem,
  ProjectStatus,
  ProjectSection,
  ProjectSectionSummary,
  ProjectSectionsSummary,
  ProjectKPI,
} from './model';

// =============================================================================
// BUSINESS RULES
// Status labels, validation, and domain logic
// =============================================================================

export { PROJECT_STATUS_LABELS, projectRules } from './model';

// =============================================================================
// QUERY HOOKS
// Main data access interface - prefer these over direct API calls
// =============================================================================

export { useProject } from './query';

// Query keys for cache invalidation (used by features for mutations)
export { projectQueryKeys } from './query';

// =============================================================================
// FORM TYPES
// Input types for forms (used by features layer)
// =============================================================================

export type { CreateProjectInput, UpdateProjectInput, ProjectCommandResult } from './api';

// =============================================================================
// API ACCESS (for features layer mutations only)
// These are needed by features/project/* for CRUD operations
// =============================================================================

export { projectApi, projectSummaryApi } from './api';
export { projectMapper, projectCommandMapper } from './api';

// =============================================================================
// LEGACY ALIASES (for backward compatibility - prefer Input types)
// =============================================================================

/** @deprecated Use CreateProjectInput instead */
export type { CreateProjectRequestDTO as CreateProjectRequest } from './api';
/** @deprecated Use UpdateProjectInput instead */
export type { UpdateProjectRequestDTO as UpdateProjectRequest } from './api';
