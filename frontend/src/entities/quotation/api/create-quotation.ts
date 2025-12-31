/**
 * Create Quotation API function with validation.
 *
 * Combines Input validation, mapping, and HTTP POST in one module.
 * Follows FSD pattern: entities/{entity}/api/create-{entity}.ts
 */

import { DomainValidationError, httpClient, QUOTATION_ENDPOINTS } from '@/shared/api';
import type { CommandResult, CreateQuotationRequest, LineItemRequest } from './quotation.dto';

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Line item input from UI forms.
 *
 * UI-friendly types (allows nulls and string inputs for form fields).
 */
export interface LineItemInput {
  productId: number | null;
  quantity: number | string;
  unitPrice: number | string;
  notes?: string;
}

/**
 * Create quotation input from UI forms.
 *
 * Will be validated then converted to CreateQuotationRequest.
 */
export interface CreateQuotationInput {
  projectId: number | null;
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
 * Validate create quotation input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateCreateInput(input: CreateQuotationInput): void {
  if (input.projectId === null) {
    throw new DomainValidationError('REQUIRED', 'projectId', 'Project is required');
  }

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
 * Map create input to API request.
 */
function toCreateRequest(input: CreateQuotationInput): CreateQuotationRequest {
  return {
    projectId: input.projectId!, // Validated as not null
    validityDays: input.validityDays ?? 30,
    notes: input.notes?.trim() || undefined,
    lineItems: input.lineItems.map(toLineItemRequest),
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Create a new quotation.
 *
 * Validates input, maps to request, and calls API.
 *
 * @param input - UI form input
 * @returns Command result with created quotation ID
 * @throws DomainValidationError if validation fails
 *
 * @example
 * ```typescript
 * const result = await createQuotation({
 *   projectId: 1,
 *   lineItems: [{ productId: 1, quantity: 10, unitPrice: 100 }],
 * });
 * console.log(`Created quotation: ${result.id}`);
 * ```
 */
export async function createQuotation(input: CreateQuotationInput): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.BASE, request);
}
