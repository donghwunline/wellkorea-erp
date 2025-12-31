/**
 * Quotation command types and validation.
 *
 * Command types are used for write operations (create, update).
 * Separate from the read-side Quotation model.
 *
 * Validation runs on Command types (entities-owned), not feature input types.
 * This prevents entities from depending on feature types.
 */

import { DomainValidationError } from '@/shared/api';

/**
 * Line item input for commands.
 */
export interface LineItemCommand {
  readonly productId: number;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly notes?: string;
}

/**
 * Command for creating a new quotation.
 */
export interface CreateQuotationCommand {
  readonly projectId: number;
  readonly validityDays?: number;
  readonly notes?: string;
  readonly lineItems: readonly LineItemCommand[];
}

/**
 * Command for updating an existing quotation.
 */
export interface UpdateQuotationCommand {
  readonly validityDays?: number;
  readonly notes?: string;
  readonly lineItems: readonly LineItemCommand[];
}

/**
 * Quotation command validation functions.
 *
 * Throws DomainValidationError on validation failure.
 * Errors include field path for form error mapping.
 */
export const quotationValidation = {
  /**
   * Validate create command before API call.
   *
   * @throws DomainValidationError if validation fails
   */
  validateCreate(command: CreateQuotationCommand): void {
    if (!command.projectId) {
      throw new DomainValidationError('REQUIRED', 'projectId', 'Project is required');
    }

    if (command.lineItems.length === 0) {
      throw new DomainValidationError(
        'REQUIRED',
        'lineItems',
        'At least one line item is required'
      );
    }

    quotationValidation.validateLineItems(command.lineItems);
  },

  /**
   * Validate update command before API call.
   *
   * @throws DomainValidationError if validation fails
   */
  validateUpdate(command: UpdateQuotationCommand): void {
    if (command.lineItems.length === 0) {
      throw new DomainValidationError(
        'REQUIRED',
        'lineItems',
        'At least one line item is required'
      );
    }

    quotationValidation.validateLineItems(command.lineItems);
  },

  /**
   * Validate line items array.
   *
   * @throws DomainValidationError if validation fails
   */
  validateLineItems(lineItems: readonly LineItemCommand[]): void {
    for (let index = 0; index < lineItems.length; index++) {
      const item = lineItems[index];

      if (!item.productId) {
        throw new DomainValidationError(
          'REQUIRED',
          `lineItems[${index}].productId`,
          'Product is required'
        );
      }

      if (item.quantity <= 0) {
        throw new DomainValidationError(
          'OUT_OF_RANGE',
          `lineItems[${index}].quantity`,
          'Quantity must be greater than 0'
        );
      }

      if (item.unitPrice < 0) {
        throw new DomainValidationError(
          'OUT_OF_RANGE',
          `lineItems[${index}].unitPrice`,
          'Unit price cannot be negative'
        );
      }
    }
  },
};
