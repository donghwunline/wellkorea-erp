/**
 * Task Flow Entity - Public API
 *
 * Exports:
 * - Domain types (TaskNode, TaskEdge, TaskFlow)
 * - Business rules (taskNodeRules)
 * - Query factory (taskFlowQueries)
 * - Command functions (saveTaskFlow)
 * - UI components (TaskNodeComponent)
 */

// ============================================================================
// Domain Types
// ============================================================================

export type { TaskNode, ProgressLevel, ProgressColor } from './model/task-node';
export type { TaskEdge } from './model/task-edge';
export type { TaskFlow } from './model/task-flow';

// ============================================================================
// Business Rules
// ============================================================================

export { taskNodeRules } from './model/task-node';

// ============================================================================
// Query Factory
// ============================================================================

export { taskFlowQueries } from './api/task-flow.queries';

// ============================================================================
// Command Functions
// ============================================================================

export { saveTaskFlow, type SaveTaskFlowInput } from './api/save-task-flow';

// Re-export CommandResult type for features
export type { CommandResult } from './api/task-flow.mapper';

// ============================================================================
// UI Components
// ============================================================================

export { TaskNodeComponent } from './ui/TaskNodeComponent';
export type { TaskNodeData, TaskFlowNode } from './ui/TaskNodeComponent';
