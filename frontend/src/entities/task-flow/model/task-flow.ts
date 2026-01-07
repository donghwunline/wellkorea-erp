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

/**
 * Business rules for task flows.
 */
export const taskFlowRules = {
  /**
   * Detect cycles in directed graph using DFS.
   * Returns true if the edges form a cycle (invalid DAG).
   */
  hasCycle(edges: readonly TaskEdge[]): boolean {
    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    for (const edge of edges) {
      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, []);
      }
      adjacency.get(edge.source)!.push(edge.target);
    }

    // Track visited nodes: 0=unvisited, 1=in-progress, 2=completed
    const state = new Map<string, number>();

    function dfs(node: string): boolean {
      const nodeState = state.get(node) ?? 0;
      if (nodeState === 1) return true; // Back edge = cycle
      if (nodeState === 2) return false; // Already processed

      state.set(node, 1); // Mark in-progress
      for (const neighbor of adjacency.get(node) ?? []) {
        if (dfs(neighbor)) return true;
      }
      state.set(node, 2); // Mark completed
      return false;
    }

    // Check all nodes (handles disconnected components)
    for (const source of adjacency.keys()) {
      if ((state.get(source) ?? 0) === 0 && dfs(source)) {
        return true;
      }
    }
    return false;
  },
};
