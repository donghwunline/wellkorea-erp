/**
 * Create Purchase Request command.
 *
 * Follows FSD Command Function pattern with built-in validation.
 */

import { httpClient, PURCHASE_REQUEST_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './purchase-request.mapper';

// =============================================================================
// INPUT TYPE (Public API)
// =============================================================================

/**
 * Input for creating a purchase request.
 * This is the public contract for the command function.
 */
export interface CreatePurchaseRequestInput {
  readonly serviceCategoryId: number;
  readonly projectId?: number | null;
  readonly description: string;
  readonly quantity: number;
  readonly uom: string;
  readonly requiredDate?: string | null;
}

// =============================================================================
// REQUEST TYPE (Internal)
// =============================================================================

/**
 * API request payload.
 * @internal
 */
interface CreatePurchaseRequestRequest {
  serviceCategoryId: number;
  projectId: number | null;
  description: string;
  quantity: number;
  uom: string;
  requiredDate: string | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate create input.
 * @throws DomainValidationError if validation fails
 */
function validateCreateInput(input: CreatePurchaseRequestInput): void {
  if (!input.serviceCategoryId) {
    throw new DomainValidationError('REQUIRED', 'serviceCategoryId', 'Service category is required');
  }
  if (!input.description?.trim()) {
    throw new DomainValidationError('REQUIRED', 'description', 'Description is required');
  }
  if (input.quantity <= 0) {
    throw new DomainValidationError('OUT_OF_RANGE', 'quantity', 'Quantity must be greater than 0');
  }
  if (!input.uom?.trim()) {
    throw new DomainValidationError('REQUIRED', 'uom', 'Unit of measure is required');
  }
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Create a new purchase request.
 *
 * @param input - Purchase request data
 * @returns Command result with created ID
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 *
 * @example
 * const result = await createPurchaseRequest({
 *   serviceCategoryId: 1,
 *   description: 'Raw materials for project',
 *   quantity: 100,
 *   uom: 'EA',
 * });
 */
export async function createPurchaseRequest(
  input: CreatePurchaseRequestInput
): Promise<CommandResult> {
  validateCreateInput(input);

  const request: CreatePurchaseRequestRequest = {
    serviceCategoryId: input.serviceCategoryId,
    projectId: input.projectId ?? null,
    description: input.description.trim(),
    quantity: input.quantity,
    uom: input.uom.trim(),
    requiredDate: input.requiredDate ?? null,
  };

  return httpClient.post<CommandResult>(PURCHASE_REQUEST_ENDPOINTS.BASE, request);
}
