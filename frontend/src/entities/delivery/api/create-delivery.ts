/**
 * Create delivery command function.
 */

import { httpClient, DELIVERY_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './delivery.mapper';

/**
 * Input for creating a delivery line item.
 */
export interface CreateDeliveryLineItemInput {
  productId: number;
  quantityDelivered: number;
}

/**
 * Input for creating a delivery.
 * 
 * The quotationId explicitly binds the delivery to a specific quotation version,
 * preventing race conditions where the "latest approved" quotation might change
 * between when the user views the data and when they submit the delivery.
 */
export interface CreateDeliveryInput {
  projectId: number;
  quotationId: number; // Explicit binding to prevent race conditions
  deliveryDate: string; // ISO date string (YYYY-MM-DD)
  lineItems: CreateDeliveryLineItemInput[];
  notes?: string;
}

/**
 * Request DTO for backend (internal).
 */
interface CreateDeliveryRequest {
  quotationId: number;
  deliveryDate: string;
  lineItems: Array<{
    productId: number;
    quantityDelivered: number;
  }>;
  notes?: string;
}

/**
 * Validate create delivery input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateCreateInput(input: CreateDeliveryInput): void {
  if (!input.projectId || input.projectId <= 0) {
    throw new DomainValidationError('REQUIRED', 'projectId', 'Project ID is required');
  }

  if (!input.quotationId || input.quotationId <= 0) {
    throw new DomainValidationError('REQUIRED', 'quotationId', 'Quotation ID is required');
  }

  if (!input.deliveryDate) {
    throw new DomainValidationError('REQUIRED', 'deliveryDate', 'Delivery date is required');
  }

  if (!input.lineItems || input.lineItems.length === 0) {
    throw new DomainValidationError('REQUIRED', 'lineItems', 'At least one line item is required');
  }

  for (let i = 0; i < input.lineItems.length; i++) {
    const item = input.lineItems[i];
    if (!item.productId || item.productId <= 0) {
      throw new DomainValidationError(
        'REQUIRED',
        `lineItems[${i}].productId`,
        'Product ID is required for each line item'
      );
    }
    if (!item.quantityDelivered || item.quantityDelivered <= 0) {
      throw new DomainValidationError(
        'OUT_OF_RANGE',
        `lineItems[${i}].quantityDelivered`,
        'Quantity must be greater than 0'
      );
    }
  }
}

/**
 * Map input to request DTO.
 */
function toCreateRequest(input: CreateDeliveryInput): CreateDeliveryRequest {
  return {
    quotationId: input.quotationId,
    deliveryDate: input.deliveryDate,
    lineItems: input.lineItems.map(item => ({
      productId: item.productId,
      quantityDelivered: item.quantityDelivered,
    })),
    notes: input.notes,
  };
}

/**
 * Create a new delivery.
 */
export async function createDelivery(input: CreateDeliveryInput): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(
    `${DELIVERY_ENDPOINTS.BASE}?projectId=${input.projectId}`,
    request
  );
}
