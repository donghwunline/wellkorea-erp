/**
 * Update Chain Levels command function.
 *
 * Encapsulates mapping and API call for updating approval chain levels.
 */

import { httpClient, APPROVAL_CHAIN_ENDPOINTS } from '@/shared/api';
import type { ChainLevelInput } from '../model/chain-template';
import type { CommandResult } from './chain-template.mapper';

// =============================================================================
// REQUEST TYPES (internal)
// =============================================================================

/**
 * Request for a single chain level.
 */
interface ChainLevelRequest {
  levelOrder: number;
  levelName: string;
  approverUserId: number;
  isRequired: boolean;
}

/**
 * Request for updating chain levels.
 */
interface UpdateChainLevelsRequest {
  levels: ChainLevelRequest[];
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map ChainLevelInput to request.
 */
function toLevelRequest(input: ChainLevelInput): ChainLevelRequest {
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
): Promise<CommandResult> {
  const request: UpdateChainLevelsRequest = {
    levels: levels.map(toLevelRequest),
  };
  return httpClient.put<CommandResult>(APPROVAL_CHAIN_ENDPOINTS.levels(templateId), request);
}
