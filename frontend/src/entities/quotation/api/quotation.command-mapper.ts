/**
 * Quotation command mappers.
 *
 * Two-step mapping for write operations:
 * 1. Feature Input → Command (for validation)
 * 2. Command → API DTO (for API call)
 *
 * This pattern separates:
 * - UI-friendly input types (strings allowed, optional fields)
 * - Validated command types (numbers required, normalized)
 * - API DTOs (exact backend contract)
 */

import type {
  CreateQuotationCommand,
  UpdateQuotationCommand,
  LineItemCommand,
} from '../model';
import type {
  CreateQuotationRequestDTO,
  UpdateQuotationRequestDTO,
  LineItemRequestDTO,
} from './quotation.dto';

/**
 * Feature input types for quotation forms.
 *
 * These types are UI-friendly:
 * - Allow string inputs (form fields)
 * - Allow empty/optional values
 * - Will be converted to Command types
 */
export interface CreateQuotationInput {
  projectId: number | null;
  validityDays?: number;
  notes?: string;
  lineItems: LineItemInput[];
}

export interface UpdateQuotationInput {
  validityDays?: number;
  notes?: string;
  lineItems: LineItemInput[];
}

export interface LineItemInput {
  productId: number | null;
  quantity: number | string;
  unitPrice: number | string;
  notes?: string;
}

/**
 * Quotation command mappers.
 */
export const quotationCommandMapper = {
  /**
   * Map feature input to domain command (for validation).
   * Handles string → number conversion and normalization.
   *
   * @throws Error if projectId is null
   */
  toCreateCommand(input: CreateQuotationInput): CreateQuotationCommand {
    if (input.projectId === null) {
      throw new Error('Project is required');
    }

    return {
      projectId: input.projectId,
      validityDays: input.validityDays ?? 30, // Default value
      notes: input.notes?.trim() || undefined,
      lineItems: input.lineItems.map(quotationCommandMapper.toLineItemCommand),
    };
  },

  /**
   * Map feature input to update command (for validation).
   */
  toUpdateCommand(input: UpdateQuotationInput): UpdateQuotationCommand {
    return {
      validityDays: input.validityDays,
      notes: input.notes?.trim() || undefined,
      lineItems: input.lineItems.map(quotationCommandMapper.toLineItemCommand),
    };
  },

  /**
   * Map line item input to command.
   * Ensures numbers (form inputs may be strings).
   *
   * @throws Error if productId is null
   */
  toLineItemCommand(input: LineItemInput): LineItemCommand {
    if (input.productId === null) {
      throw new Error('Product is required');
    }

    return {
      productId: input.productId,
      quantity: Number(input.quantity),
      unitPrice: Number(input.unitPrice),
      notes: input.notes?.trim() || undefined,
    };
  },

  /**
   * Map validated create command to API DTO.
   * Command is already validated, just transform to API shape.
   */
  toCreateDto(command: CreateQuotationCommand): CreateQuotationRequestDTO {
    return {
      projectId: command.projectId,
      validityDays: command.validityDays,
      notes: command.notes,
      lineItems: command.lineItems.map(quotationCommandMapper.toLineItemDto),
    };
  },

  /**
   * Map validated update command to API DTO.
   */
  toUpdateDto(command: UpdateQuotationCommand): UpdateQuotationRequestDTO {
    return {
      validityDays: command.validityDays,
      notes: command.notes,
      lineItems: command.lineItems.map(quotationCommandMapper.toLineItemDto),
    };
  },

  /**
   * Map line item command to API DTO.
   */
  toLineItemDto(command: LineItemCommand): LineItemRequestDTO {
    return {
      productId: command.productId,
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      notes: command.notes,
    };
  },
};
