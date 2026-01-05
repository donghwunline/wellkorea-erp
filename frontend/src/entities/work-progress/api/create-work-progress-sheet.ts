/**
 * Create Work Progress Sheet API function with validation.
 *
 * Combines Input validation, mapping, and HTTP POST in one module.
 * Follows FSD pattern: entities/{entity}/api/create-{entity}.ts
 */

import { DomainValidationError, httpClient, WORK_PROGRESS_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './work-progress.mapper';

// =============================================================================
// REQUEST TYPES (internal)
// =============================================================================

/**
 * Request for creating a new work progress sheet.
 */
interface CreateWorkProgressSheetRequest {
  projectId: number;
  productId: number;
  quantity?: number;
  sequence?: number;
  notes?: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Create work progress sheet input from UI forms.
 *
 * Will be validated then converted to CreateWorkProgressSheetRequest.
 */
export interface CreateWorkProgressSheetInput {
  projectId: number | null;
  productId: number | null;
  quantity?: number | string;
  sequence?: number | string;
  notes?: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate create work progress sheet input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateCreateInput(input: CreateWorkProgressSheetInput): void {
  if (input.projectId === null) {
    throw new DomainValidationError('REQUIRED', 'projectId', 'Project is required');
  }

  if (input.productId === null) {
    throw new DomainValidationError('REQUIRED', 'productId', 'Product is required');
  }

  if (input.quantity !== undefined) {
    const quantity = Number(input.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      throw new DomainValidationError('OUT_OF_RANGE', 'quantity', 'Quantity must be greater than 0');
    }
  }

  if (input.sequence !== undefined) {
    const sequence = Number(input.sequence);
    if (isNaN(sequence) || sequence < 0) {
      throw new DomainValidationError('OUT_OF_RANGE', 'sequence', 'Sequence cannot be negative');
    }
  }
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map create input to API request.
 */
function toCreateRequest(input: CreateWorkProgressSheetInput): CreateWorkProgressSheetRequest {
  return {
    projectId: input.projectId!, // Validated as not null
    productId: input.productId!, // Validated as not null
    quantity: input.quantity ? Number(input.quantity) : undefined,
    sequence: input.sequence ? Number(input.sequence) : undefined,
    notes: input.notes?.trim() || undefined,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Create a new work progress sheet.
 *
 * Validates input, maps to request, and calls API.
 *
 * @param input - UI form input
 * @returns Command result with created sheet ID
 * @throws DomainValidationError if validation fails
 *
 * @example
 * ```typescript
 * const result = await createWorkProgressSheet({
 *   projectId: 1,
 *   productId: 2,
 *   quantity: 5,
 * });
 * console.log(`Created sheet: ${result.id}`);
 * ```
 */
export async function createWorkProgressSheet(
  input: CreateWorkProgressSheetInput
): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(WORK_PROGRESS_ENDPOINTS.BASE, request);
}
