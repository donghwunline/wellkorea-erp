/**
 * Task Flow API mapper.
 * Converts API response DTOs to domain models.
 * Internal - not exported from entity barrel.
 */

import type { TaskFlow } from '../model/task-flow';
import type { TaskNode } from '../model/task-node';
import type { TaskEdge } from '../model/task-edge';

// ============================================================================
// Response Types (from API)
// ============================================================================

export interface TaskNodeResponse {
  id: string;
  title: string;
  assignee: string | null;
  deadline: string | null;
  progress: number;
  positionX: number;
  positionY: number;
}

export interface TaskEdgeResponse {
  id: string;
  source: string;
  target: string;
}

export interface TaskFlowResponse {
  id: number;
  projectId: number;
  nodes: TaskNodeResponse[];
  edges: TaskEdgeResponse[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CommandResult {
  id: number;
  message: string;
}

// ============================================================================
// Mappers
// ============================================================================

export const taskFlowMapper = {
  /**
   * Convert API response to domain model.
   */
  toDomain(response: TaskFlowResponse): TaskFlow {
    return {
      id: response.id,
      projectId: response.projectId,
      nodes: response.nodes.map(taskFlowMapper.nodeToDomain),
      edges: response.edges.map(taskFlowMapper.edgeToDomain),
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  },

  /**
   * Convert node response to domain model.
   */
  nodeToDomain(response: TaskNodeResponse): TaskNode {
    return {
      id: response.id,
      title: response.title.trim(),
      assignee: response.assignee?.trim() ?? null,
      deadline: response.deadline,
      progress: response.progress,
      position: {
        x: response.positionX,
        y: response.positionY,
      },
    };
  },

  /**
   * Convert edge response to domain model.
   */
  edgeToDomain(response: TaskEdgeResponse): TaskEdge {
    return {
      id: response.id,
      source: response.source,
      target: response.target,
    };
  },
};
