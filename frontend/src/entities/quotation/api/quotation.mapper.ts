/**
 * Quotation Response to Domain model mappers.
 *
 * Maps API Response types to domain models (read-side).
 * Always returns plain objects (not class instances).
 */

import { type Quotation, type QuotationListItem, quotationRules } from '../model/quotation';
import type { LineItem } from '../model/line-item';
import type { QuotationStatus } from '../model/quotation-status';
import type { LineItemResponse, QuotationDetailsResponse } from './quotation.dto';

/**
 * Line item mapper.
 */
const lineItemMapper = {
  /**
   * Map API response to domain model (plain object).
   */
  toDomain(response: LineItemResponse): LineItem {
    return {
      id: response.id,
      productId: response.productId,
      productSku: response.productSku,
      productName: response.productName,
      sequence: response.sequence,
      quantity: response.quantity,
      unitPrice: response.unitPrice,
      lineTotal: response.lineTotal,
      notes: response.notes?.trim() ?? null,
    };
  },
};

/**
 * Quotation mapper.
 */
export const quotationMapper = {
  /**
   * Map API response to domain model (plain object).
   * Dates kept as ISO strings for serialization compatibility.
   */
  toDomain(response: QuotationDetailsResponse): Quotation {
    const lineItems = (response.lineItems ?? []).map(lineItemMapper.toDomain);

    return {
      id: response.id,
      projectId: response.projectId,
      projectName: response.projectName.trim(),
      jobCode: response.jobCode,
      version: response.version,
      status: response.status as QuotationStatus,
      quotationDate: response.quotationDate,
      validityDays: response.validityDays,
      expiryDate: response.expiryDate,
      totalAmount: response.totalAmount,
      notes: response.notes?.trim() ?? null,
      createdById: response.createdById,
      createdByName: response.createdByName.trim(),
      submittedAt: response.submittedAt,
      approvedAt: response.approvedAt,
      approvedById: response.approvedById,
      approvedByName: response.approvedByName?.trim() ?? null,
      rejectionReason: response.rejectionReason?.trim() ?? null,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
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
   * Map response directly to list item (skipping full domain model).
   * Useful when full model parsing is not needed.
   */
  responseToListItem(response: QuotationDetailsResponse): QuotationListItem {
    return {
      id: response.id,
      jobCode: response.jobCode,
      projectId: response.projectId,
      projectName: response.projectName.trim(),
      version: response.version,
      status: response.status as QuotationStatus,
      totalAmount: response.totalAmount,
      createdAt: response.createdAt,
      createdByName: response.createdByName.trim(),
    };
  },
};
