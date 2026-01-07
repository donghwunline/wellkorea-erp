/**
 * Save Task Flow command function.
 * Exported from entity barrel for use in features.
 */

import { httpClient, TASK_FLOW_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './task-flow.mapper';
import type { TaskNode } from '../model/task-node';
import type { TaskEdge } from '../model/task-edge';

// ============================================================================
// Input Types (exported for features)
// ============================================================================

export interface SaveTaskFlowInput {
  id: number;
  nodes: readonly TaskNode[];
  edges: readonly TaskEdge[];
}

// ============================================================================
// Request Types (internal)
// ============================================================================

interface SaveTaskFlowRequest {
  nodes: Array<{
    id: string;
    title: string;
    assignee: string | null;
    deadline: string | null;
    progress: number;
    positionX: number;
    positionY: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

// ============================================================================
// Validation
// ============================================================================

function validateInput(input: SaveTaskFlowInput): void {
  if (!input.id) {
    throw new DomainValidationError('REQUIRED', 'id', 'Task flow ID is required');
  }

  // Validate nodes
  for (let i = 0; i < input.nodes.length; i++) {
    const node = input.nodes[i];
    if (!node.title?.trim()) {
      throw new DomainValidationError(
        'REQUIRED',
        `nodes[${i}].title`,
        'Task title is required'
      );
    }
    if (node.progress < 0 || node.progress > 100) {
      throw new DomainValidationError(
        'OUT_OF_RANGE',
        `nodes[${i}].progress`,
        'Progress must be between 0 and 100'
      );
    }
  }

  // Validate edges reference existing nodes
  const nodeIds = new Set(input.nodes.map(n => n.id));
  for (let i = 0; i < input.edges.length; i++) {
    const edge = input.edges[i];
    if (!nodeIds.has(edge.source)) {
      throw new DomainValidationError(
        'INVALID_REFERENCE',
        `edges[${i}].source`,
        'Edge source references non-existent node'
      );
    }
    if (!nodeIds.has(edge.target)) {
      throw new DomainValidationError(
        'INVALID_REFERENCE',
        `edges[${i}].target`,
        'Edge target references non-existent node'
      );
    }
  }
}

// ============================================================================
// Mapping
// ============================================================================

function toRequest(input: SaveTaskFlowInput): SaveTaskFlowRequest {
  return {
    nodes: input.nodes.map(node => ({
      id: node.id,
      title: node.title.trim(),
      assignee: node.assignee?.trim() || null,
      deadline: node.deadline,
      progress: node.progress,
      positionX: node.position.x,
      positionY: node.position.y,
    })),
    edges: input.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };
}

// ============================================================================
// Command Function
// ============================================================================

/**
 * Save task flow with nodes and edges.
 * Performs full replacement of all nodes and edges.
 */
export async function saveTaskFlow(input: SaveTaskFlowInput): Promise<CommandResult> {
  validateInput(input);
  const request = toRequest(input);
  return httpClient.put<CommandResult>(TASK_FLOW_ENDPOINTS.byId(input.id), request);
}
