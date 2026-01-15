/**
 * Blueprint attachment query factory using TanStack Query v5 queryOptions pattern.
 */

import { queryOptions } from '@tanstack/react-query';
import {
  getAttachmentsByFlow,
  getAttachmentsByNode,
  getAttachmentById,
  getAttachmentDownloadUrl,
} from './get-attachments';
import { blueprintMapper } from './blueprint-attachment.mapper';
import type { BlueprintAttachment } from '../model/blueprint-attachment';

/**
 * Query factory for blueprint attachment queries.
 * Usage: useQuery(blueprintQueries.byFlow(flowId))
 */
export const blueprintQueries = {
  /**
   * Base query key for all blueprint attachment queries.
   */
  all: () => ['blueprints'] as const,

  /**
   * Query key for list queries.
   */
  lists: () => [...blueprintQueries.all(), 'list'] as const,

  /**
   * Query options for fetching all attachments for a TaskFlow.
   */
  byFlow: (flowId: number) =>
    queryOptions({
      queryKey: [...blueprintQueries.lists(), 'flow', flowId],
      queryFn: async (): Promise<BlueprintAttachment[]> => {
        const response = await getAttachmentsByFlow(flowId);
        return blueprintMapper.toDomainList(response);
      },
      enabled: flowId > 0,
    }),

  /**
   * Query options for fetching attachments for a specific node.
   */
  byNode: (flowId: number, nodeId: string) =>
    queryOptions({
      queryKey: [...blueprintQueries.lists(), 'node', flowId, nodeId],
      queryFn: async (): Promise<BlueprintAttachment[]> => {
        const response = await getAttachmentsByNode(flowId, nodeId);
        return blueprintMapper.toDomainList(response);
      },
      enabled: flowId > 0 && nodeId.length > 0,
    }),

  /**
   * Query key for detail queries.
   */
  details: () => [...blueprintQueries.all(), 'detail'] as const,

  /**
   * Query options for fetching single attachment metadata.
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...blueprintQueries.details(), id],
      queryFn: async (): Promise<BlueprintAttachment> => {
        const response = await getAttachmentById(id);
        return blueprintMapper.toDomain(response);
      },
      enabled: id > 0,
    }),

  /**
   * Query key for download URL queries.
   */
  urls: () => [...blueprintQueries.all(), 'url'] as const,

  /**
   * Query options for fetching presigned download URL.
   * URL expires after expiryMinutes (default 15).
   */
  downloadUrl: (id: number, expiryMinutes: number = 15) =>
    queryOptions({
      queryKey: [...blueprintQueries.urls(), id, expiryMinutes],
      queryFn: async (): Promise<string> => {
        return getAttachmentDownloadUrl(id, expiryMinutes);
      },
      enabled: id > 0,
      // URLs expire, so set a reasonable stale time
      staleTime: (expiryMinutes - 1) * 60 * 1000, // 1 minute before expiry
    }),
};
