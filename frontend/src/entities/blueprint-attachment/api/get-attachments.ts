/**
 * Blueprint attachment GET operations.
 * Internal - used by query factory.
 */

import { httpClient, BLUEPRINT_ENDPOINTS } from '@/shared/api';
import type { BlueprintAttachmentResponse } from './blueprint-attachment.mapper';

/**
 * Get all attachments for a TaskFlow.
 */
export async function getAttachmentsByFlow(
  flowId: number
): Promise<BlueprintAttachmentResponse[]> {
  return httpClient.get<BlueprintAttachmentResponse[]>(
    BLUEPRINT_ENDPOINTS.byFlow(flowId)
  );
}

/**
 * Get attachments for a specific node.
 */
export async function getAttachmentsByNode(
  flowId: number,
  nodeId: string
): Promise<BlueprintAttachmentResponse[]> {
  return httpClient.get<BlueprintAttachmentResponse[]>(
    BLUEPRINT_ENDPOINTS.byNode(flowId, nodeId)
  );
}

/**
 * Get all attachments for a project (via TaskFlow relationship).
 */
export async function getAttachmentsByProject(
  projectId: number
): Promise<BlueprintAttachmentResponse[]> {
  return httpClient.get<BlueprintAttachmentResponse[]>(
    BLUEPRINT_ENDPOINTS.byProject(projectId)
  );
}

/**
 * Get attachment metadata by ID.
 */
export async function getAttachmentById(
  id: number
): Promise<BlueprintAttachmentResponse> {
  return httpClient.get<BlueprintAttachmentResponse>(
    BLUEPRINT_ENDPOINTS.byId(id)
  );
}

/**
 * Get presigned download URL for an attachment.
 */
export async function getAttachmentDownloadUrl(
  id: number,
  expiryMinutes: number = 15
): Promise<string> {
  return httpClient.get<string>(
    `${BLUEPRINT_ENDPOINTS.url(id)}?expiryMinutes=${expiryMinutes}`
  );
}
