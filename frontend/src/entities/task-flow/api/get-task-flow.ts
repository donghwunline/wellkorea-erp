/**
 * Task Flow GET operations.
 * Internal - used by query factory, not exported from barrel.
 */

import { httpClient, TASK_FLOW_ENDPOINTS } from '@/shared/api';
import type { TaskFlowResponse } from './task-flow.mapper';

/**
 * Get task flow for a project.
 * Creates a new empty flow if one doesn't exist.
 */
export async function getTaskFlow(params: {
  projectId: number;
}): Promise<TaskFlowResponse> {
  return httpClient.get<TaskFlowResponse>(TASK_FLOW_ENDPOINTS.BASE, {
    params: { projectId: params.projectId },
  });
}

/**
 * Get task flow by ID.
 */
export async function getTaskFlowById(id: number): Promise<TaskFlowResponse> {
  return httpClient.get<TaskFlowResponse>(TASK_FLOW_ENDPOINTS.byId(id));
}
