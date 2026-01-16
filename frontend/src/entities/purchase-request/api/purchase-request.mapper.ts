/**
 * Purchase Request Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 */

import type { PurchaseRequest, PurchaseRequestListItem } from '../model/purchase-request';
import type { RfqItem } from '../model/rfq-item';
import type { PurchaseRequestStatus } from '../model/purchase-request-status';
import type { RfqItemStatus } from '../model/rfq-item-status';

/**
 * Command result for write operations.
 */
export interface CommandResult {
  id: number;
  message: string;
}

// =============================================================================
// RESPONSE TYPES (internal to entity)
// =============================================================================

export interface RfqItemResponse {
  id: number;
  purchaseRequestId: number;
  vendorId: number;
  vendorName: string;
  vendorOfferingId: number | null;
  status: string;
  quotedPrice: number | null;
  quotedLeadTime: number | null;
  notes: string | null;
  sentAt: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export interface PurchaseRequestSummaryResponse {
  id: number;
  requestNumber: string;
  projectId: number;
  jobCode: string;
  serviceCategoryId: number;
  serviceCategoryName: string;
  description: string;
  quantity: number;
  uom: string;
  requiredDate: string;
  status: string;
  createdByName: string;
  createdAt: string;
}

export interface PurchaseRequestDetailResponse {
  id: number;
  requestNumber: string;
  projectId: number;
  jobCode: string;
  projectName: string;
  serviceCategoryId: number;
  serviceCategoryName: string;
  description: string;
  quantity: number;
  uom: string;
  requiredDate: string;
  status: string;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  rfqItems: RfqItemResponse[] | null;
}

export interface PurchaseRequestListParams {
  page?: number;
  size?: number;
  status?: string;
  projectId?: number;
}

// =============================================================================
// MAPPERS
// =============================================================================

const rfqItemMapper = {
  toDomain(response: RfqItemResponse): RfqItem {
    return {
      id: response.id,
      purchaseRequestId: response.purchaseRequestId,
      vendorId: response.vendorId,
      vendorName: response.vendorName.trim(),
      vendorOfferingId: response.vendorOfferingId,
      status: response.status as RfqItemStatus,
      quotedPrice: response.quotedPrice,
      quotedLeadTime: response.quotedLeadTime,
      notes: response.notes?.trim() ?? null,
      sentAt: response.sentAt,
      repliedAt: response.repliedAt,
      createdAt: response.createdAt,
    };
  },
};

export const purchaseRequestMapper = {
  /**
   * Map API response to domain model.
   */
  toDomain(response: PurchaseRequestDetailResponse): PurchaseRequest {
    const rfqItems = (response.rfqItems ?? []).map(rfqItemMapper.toDomain);

    return {
      id: response.id,
      requestNumber: response.requestNumber,
      projectId: response.projectId,
      jobCode: response.jobCode,
      projectName: response.projectName.trim(),
      serviceCategoryId: response.serviceCategoryId,
      serviceCategoryName: response.serviceCategoryName.trim(),
      description: response.description.trim(),
      quantity: response.quantity,
      uom: response.uom,
      requiredDate: response.requiredDate,
      status: response.status as PurchaseRequestStatus,
      createdById: response.createdById,
      createdByName: response.createdByName.trim(),
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      rfqItems,
    };
  },

  /**
   * Map summary response directly to list item (optimized for lists).
   */
  summaryToListItem(response: PurchaseRequestSummaryResponse): PurchaseRequestListItem {
    return {
      id: response.id,
      requestNumber: response.requestNumber,
      projectId: response.projectId,
      jobCode: response.jobCode,
      serviceCategoryId: response.serviceCategoryId,
      serviceCategoryName: response.serviceCategoryName.trim(),
      description: response.description.trim(),
      quantity: response.quantity,
      uom: response.uom,
      requiredDate: response.requiredDate,
      status: response.status as PurchaseRequestStatus,
      createdByName: response.createdByName.trim(),
      createdAt: response.createdAt,
    };
  },
};
