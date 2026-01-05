/**
 * Project Entity - Public API.
 *
 * This is the ONLY entry point for importing from the project entity.
 * Internal modules (model/, api/) should never be imported directly.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 */

// =============================================================================
// DOMAIN TYPES
// =============================================================================

export type {
  Project,
  ProjectListItem,
  ProjectStatus,
  ProjectSection,
  ProjectSectionSummary,
  ProjectSectionsSummary,
  ProjectKPI,
} from './model/project';

// Command types
export type { CreateProjectCommand, UpdateProjectCommand } from './model/project-command';

// =============================================================================
// BUSINESS RULES
// =============================================================================

export { PROJECT_STATUS_LABELS, ProjectStatusConfig, projectRules } from './model/project';
export { projectValidation } from './model/project-command';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// =============================================================================

/**
 * @example
 * ```tsx
 * // Direct usage - no custom hook needed
 * const { data: project } = useQuery(projectQueries.detail(123));
 *
 * // List query with pagination
 * const { data } = useQuery(projectQueries.list({ page: 0, size: 10, search: '', status: null }));
 *
 * // Cache invalidation
 * queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
 * ```
 */
export { projectQueries, type ProjectListQueryParams } from './api/project.queries';

// =============================================================================
// COMMAND FUNCTIONS
// =============================================================================

/**
 * @example
 * ```tsx
 * const mutation = useMutation({
 *   mutationFn: createProject,
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: projectQueries.lists() }),
 * });
 * ```
 */
export { createProject, type CreateProjectInput } from './api/create-project';
export { updateProject, type UpdateProjectInput } from './api/update-project';

// =============================================================================
// COMMAND RESULT TYPE
// =============================================================================

export type { CommandResult as ProjectCommandResult } from './api/project.mapper';

// =============================================================================
// UI COMPONENTS
// Display-only components with no side effects
// =============================================================================

export { ProjectTable, type ProjectTableProps } from './ui/ProjectTable';
export { ProjectDetailsCard, type ProjectDetailsCardProps } from './ui/ProjectDetailsCard';
export { ProjectSummaryCard, type ProjectSummaryCardProps } from './ui/ProjectSummaryCard';
export {
  ProjectKPIStrip,
  ProjectKPIStripSkeleton,
  type ProjectKPIStripProps,
} from './ui/ProjectKPIStrip';
export { ProjectCombobox, type ProjectComboboxProps } from './ui/ProjectCombobox';
