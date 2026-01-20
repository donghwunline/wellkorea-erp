/**
 * Delete blueprint attachment command function.
 */

import { httpClient, DomainValidationError, BLUEPRINT_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './blueprint-attachment.mapper';

/**
 * Input for deleting an attachment.
 */
export interface DeleteAttachmentInput {
  id: number;
}

/**
 * Validates delete attachment input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateDeleteInput(input: DeleteAttachmentInput): void {
  if (!input.id || input.id <= 0) {
    throw new DomainValidationError('REQUIRED', 'id', 'Attachment ID is required');
  }
}

/**
 * Delete a blueprint attachment.
 */
export async function deleteAttachment(
  input: DeleteAttachmentInput
): Promise<CommandResult> {
  validateDeleteInput(input);
  return httpClient.delete<CommandResult>(BLUEPRINT_ENDPOINTS.delete(input.id));
}
