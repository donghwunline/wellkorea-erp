/**
 * Update Chain Levels command function.
 *
 * Encapsulates mapping and API call for updating approval chain levels.
 */

import { httpClient, APPROVAL_CHAIN_ENDPOINTS } from '@/shared/api';
import type { ChainLevelInput } from '../model/chain-template';
import type { ChainLevelRequestDTO, UpdateChainLevelsRequestDTO } from './chain-template.dto';

// =============================================================================
// RESULT TYPE
// =============================================================================

/**
 * Command result from chain operations.
 */
export interface ChainCommandResult {
  id: number;
  message: string;
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map ChainLevelInput to request DTO.
 */
function toLevelRequest(input: ChainLevelInput): ChainLevelRequestDTO {
  return {
    levelOrder: input.levelOrder,
    levelName: input.levelName,
    approverUserId: input.approverUserId,
    isRequired: input.isRequired,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Update chain levels for a template.
 *
 * @param templateId - Chain template ID
 * @param levels - New chain levels
 * @returns Command result
 *
 * @example
 * ```typescript
 * const result = await updateChainLevels(1, [
 *   { levelOrder: 1, levelName: 'Manager', approverUserId: 10, isRequired: true },
 *   { levelOrder: 2, levelName: 'Director', approverUserId: 20, isRequired: true },
 * ]);
 * ```
 */
export async function updateChainLevels(
  templateId: number,
  levels: ChainLevelInput[]
): Promise<ChainCommandResult> {
  const request: UpdateChainLevelsRequestDTO = {
    levels: levels.map(toLevelRequest),
  };
  return httpClient.put<ChainCommandResult>(APPROVAL_CHAIN_ENDPOINTS.levels(templateId), request);
}
