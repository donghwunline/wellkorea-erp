/**
 * Quotation DTO to Domain model mappers.
 *
 * Maps API DTOs to domain models (read-side).
 * Always returns plain objects (not class instances).
 */

import { quotationRules, type Quotation, type QuotationListItem, type LineItem, type QuotationStatus } from '../model';
import type { QuotationDetailsDTO, LineItemDTO } from './quotation.dto';

/**
 * Line item mapper.
 */
export const lineItemMapper = {
  /**
   * Map API DTO to domain model (plain object).
   */
  toDomain(dto: LineItemDTO): LineItem {
    return {
      id: dto.id,
      productId: dto.productId,
      productSku: dto.productSku,
      productName: dto.productName,
      sequence: dto.sequence,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      lineTotal: dto.lineTotal,
      notes: dto.notes?.trim() ?? null,
    };
  },
};

/**
 * Quotation mapper.
 */
export const quotationMapper = {
  /**
   * Map API DTO to domain model (plain object).
   * Dates kept as ISO strings for serialization compatibility.
   */
  toDomain(dto: QuotationDetailsDTO): Quotation {
    const lineItems = (dto.lineItems ?? []).map(lineItemMapper.toDomain);

    return {
      id: dto.id,
      projectId: dto.projectId,
      projectName: dto.projectName.trim(),
      jobCode: dto.jobCode,
      version: dto.version,
      status: dto.status as QuotationStatus,
      quotationDate: dto.quotationDate,
      validityDays: dto.validityDays,
      expiryDate: dto.expiryDate,
      totalAmount: dto.totalAmount,
      notes: dto.notes?.trim() ?? null,
      createdById: dto.createdById,
      createdByName: dto.createdByName.trim(),
      submittedAt: dto.submittedAt,
      approvedAt: dto.approvedAt,
      approvedById: dto.approvedById,
      approvedByName: dto.approvedByName?.trim() ?? null,
      rejectionReason: dto.rejectionReason?.trim() ?? null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      lineItems,
    };
  },

  /**
   * Map domain model to list summary (for optimized caching).
   */
  toListItem(quotation: Quotation): QuotationListItem {
    return {
      id: quotation.id,
      jobCode: quotation.jobCode,
      projectId: quotation.projectId,
      projectName: quotation.projectName,
      version: quotation.version,
      status: quotation.status,
      totalAmount: quotationRules.calculateTotal(quotation),
      createdAt: quotation.createdAt,
      createdByName: quotation.createdByName,
    };
  },

  /**
   * Map DTO directly to list item (skipping full domain model).
   * Useful when full model parsing is not needed.
   */
  dtoToListItem(dto: QuotationDetailsDTO): QuotationListItem {
    return {
      id: dto.id,
      jobCode: dto.jobCode,
      projectId: dto.projectId,
      projectName: dto.projectName.trim(),
      version: dto.version,
      status: dto.status as QuotationStatus,
      totalAmount: dto.totalAmount,
      createdAt: dto.createdAt,
      createdByName: dto.createdByName.trim(),
    };
  },
};
