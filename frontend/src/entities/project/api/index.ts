/**
 * Project API layer - internal barrel export.
 *
 * Note: Only export what's needed by the entity's index.ts.
 * Most API internals should stay internal.
 */

// Query factory (public via entity index.ts)
export { projectQueries, type ProjectListQueryParams } from './project.queries';

// Command functions (public via entity index.ts)
export { createProject, type CreateProjectInput } from './create-project';
export { updateProject, type UpdateProjectInput } from './update-project';

// Mappers (internal - used by query factory)
export { projectMapper } from './project.mapper';

// Command result type (public - returned by command functions)
export type { ProjectCommandResult } from './project.mapper';

// =============================================================================
// LEGACY EXPORTS (backward compatibility during migration)
// TODO: Remove these after legacy components are migrated to FSD patterns
// =============================================================================

/** @deprecated Use projectQueries and command functions instead */
export { projectApi } from './project.api';

/** @deprecated Use projectQueries with projectMapper */
export { projectSummaryApi } from './project-summary.api';

/** @deprecated Use CreateProjectInput instead */
export type { CreateProjectRequestDTO as CreateProjectRequest } from './project.dto';

/** @deprecated Use UpdateProjectInput instead */
export type { UpdateProjectRequestDTO as UpdateProjectRequest } from './project.dto';
