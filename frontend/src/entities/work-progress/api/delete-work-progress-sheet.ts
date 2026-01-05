/**
 * Delete Work Progress Sheet API function.
 *
 * HTTP DELETE operation for work progress sheets.
 */

import { httpClient, WORK_PROGRESS_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './work-progress.mapper';

/**
 * Delete a work progress sheet.
 *
 * @param id - Sheet ID to delete
 * @returns Command result
 *
 * @example
 * ```typescript
 * await deleteWorkProgressSheet(123);
 * ```
 */
export async function deleteWorkProgressSheet(id: number): Promise<CommandResult> {
  return httpClient.delete<CommandResult>(WORK_PROGRESS_ENDPOINTS.byId(id));
}
