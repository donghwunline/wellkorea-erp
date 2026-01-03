/**
 * Update Quotation API function with validation.
 *
 * Combines Input validation, mapping, and HTTP PUT in one module.
 * Follows FSD pattern: entities/{entity}/api/update-{entity}.ts
 */

import { DomainValidationError, httpClient, QUOTATION_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './quotation.mapper';
import type { LineItemInput } from './create-quotation';

// =============================================================================
// REQUEST TYPES (internal)
// =============================================================================

/**
 * Line item for updating quotation.
 */
interface LineItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

/**
 * Request for updating an existing quotation.
 */
interface UpdateQuotationRequest {
  validityDays?: number;
  notes?: string;
  lineItems: LineItemRequest[];
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Update quotation input from UI forms.
 *
 * Similar to create but without projectId (can't change project).
 */
export interface UpdateQuotationInput {
  validityDays?: number;
  notes?: string;
  lineItems: LineItemInput[];
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate line items array.
 *
 * @throws DomainValidationError if validation fails
 */
function validateLineItems(lineItems: readonly LineItemInput[]): void {
  for (let index = 0; index < lineItems.length; index++) {
    const item = lineItems[index];

    if (item.productId === null) {
      throw new DomainValidationError(
        'REQUIRED',
        `lineItems[${index}].productId`,
        'Product is required'
      );
    }

    const quantity = Number(item.quantity);
    if (quantity <= 0) {
      throw new DomainValidationError(
        'OUT_OF_RANGE',
        `lineItems[${index}].quantity`,
        'Quantity must be greater than 0'
      );
    }

    const unitPrice = Number(item.unitPrice);
    if (unitPrice < 0) {
      throw new DomainValidationError(
        'OUT_OF_RANGE',
        `lineItems[${index}].unitPrice`,
        'Unit price cannot be negative'
      );
    }
  }
}

/**
 * Validate update quotation input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateUpdateInput(input: UpdateQuotationInput): void {
  if (input.lineItems.length === 0) {
    throw new DomainValidationError('REQUIRED', 'lineItems', 'At least one line item is required');
  }

  validateLineItems(input.lineItems);
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map line item input to API request.
 */
function toLineItemRequest(input: LineItemInput): LineItemRequest {
  return {
    productId: input.productId!, // Validated as not null
    quantity: Number(input.quantity),
    unitPrice: Number(input.unitPrice),
    notes: input.notes?.trim() || undefined,
  };
}

/**
 * Map update input to API request.
 */
function toUpdateRequest(input: UpdateQuotationInput): UpdateQuotationRequest {
  return {
    validityDays: input.validityDays,
    notes: input.notes?.trim() || undefined,
    lineItems: input.lineItems.map(toLineItemRequest),
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Update an existing quotation.
 *
 * Only DRAFT quotations can be updated.
 * Validates input, maps to request, and calls API.
 *
 * @param id - Quotation ID to update
 * @param input - UI form input
 * @returns Command result with updated quotation ID
 * @throws DomainValidationError if validation fails
 *
 * @example
 * ```typescript
 * const result = await updateQuotation(123, {
 *   validityDays: 45,
 *   lineItems: [{ productId: 1, quantity: 20, unitPrice: 100 }],
 * });
 * console.log(`Updated quotation: ${result.id}`);
 * ```
 */
export async function updateQuotation(
  id: number,
  input: UpdateQuotationInput
): Promise<CommandResult> {
  validateUpdateInput(input);
  const request = toUpdateRequest(input);
  return httpClient.put<CommandResult>(QUOTATION_ENDPOINTS.byId(id), request);
}
