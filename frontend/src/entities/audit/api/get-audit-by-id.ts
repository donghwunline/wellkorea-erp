/**
 * Get Audit By ID query function.
 *
 * Fetches a single audit log by ID.
 * Used by audit.queries.ts for TanStack Query integration.
 */

import { httpClient, AUDIT_ENDPOINTS } from '@/shared/api';
import type { AuditLogResponse } from './audit.mapper';

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Get audit log by ID.
 *
 * @param id - Audit log ID
 * @returns Audit log response
 *
 * @example
 * ```typescript
 * const log = await getAuditById(123);
 * ```
 */
export async function getAuditById(id: number): Promise<AuditLogResponse> {
  return httpClient.get<AuditLogResponse>(AUDIT_ENDPOINTS.byId(id));
}
