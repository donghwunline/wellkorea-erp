import type { TaskNode } from './task-node';
import type { TaskEdge } from './task-edge';

/**
 * Task flow domain model.
 * Represents a DAG (Directed Acyclic Graph) of tasks for a project.
 */
export interface TaskFlow {
  readonly id: number;
  readonly projectId: number;
  readonly nodes: readonly TaskNode[];
  readonly edges: readonly TaskEdge[];
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}
