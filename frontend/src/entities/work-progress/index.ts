/**
 * Work Progress Entity - Public API.
 *
 * This is the ONLY entry point for importing from the work-progress entity.
 * Internal modules (model/, api/, ui/) should never be imported directly.
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

export type { WorkProgressStep } from './model/work-progress-step';
export type {
  WorkProgressSheet,
  WorkProgressSheetListItem,
  ProjectProductionSummary,
} from './model/work-progress-sheet';

// =============================================================================
// STATUS
// Status enums and config for conditional rendering and business logic
// =============================================================================

export {
  StepStatus,
  SheetStatus,
  StepStatusConfig,
  SheetStatusConfig,
} from './model/step-status';
export type { StatusConfig } from './model/step-status';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic (canStart, canComplete, calculations)
// =============================================================================

export { workProgressRules, stepRules } from './model/work-progress-sheet';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// Use with useQuery() directly - no custom hooks needed
// =============================================================================

export { workProgressQueries } from './api/work-progress.queries';

// =============================================================================
// COMMAND FUNCTIONS (with validation)
// Use with useMutation() directly
// =============================================================================

export {
  createWorkProgressSheet,
  type CreateWorkProgressSheetInput,
} from './api/create-work-progress-sheet';

export {
  updateStepStatus,
  startStep,
  completeStep,
  skipStep,
  resetStep,
  type UpdateStepStatusInput,
  type StartStepInput,
  type CompleteStepInput,
  type SkipStepInput,
} from './api/update-step-status';

export { deleteWorkProgressSheet } from './api/delete-work-progress-sheet';

// Command result type (shared across commands)
export type { CommandResult } from './api/work-progress.mapper';

// =============================================================================
// UI COMPONENTS
// Display-only components with no side effects
// =============================================================================

export { StepStatusBadge } from './ui/StepStatusBadge';
export { SheetStatusBadge } from './ui/SheetStatusBadge';
export { WorkProgressBar } from './ui/WorkProgressBar';
export { WorkProgressSheetTable } from './ui/WorkProgressSheetTable';
export { WorkProgressStepList } from './ui/WorkProgressStepList';
export { ProjectProductionSummaryCard } from './ui/ProjectProductionSummaryCard';
