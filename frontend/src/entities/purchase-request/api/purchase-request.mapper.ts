/**
 * Purchase Request Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 * Supports both SERVICE and MATERIAL types via dtype discriminator.
 */

import type { PurchaseRequest, PurchaseRequestListItem, PurchaseRequestType } from '../model/purchase-request';
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
  itemId: string; // UUID string
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
  purchaseOrderId: number | null; // null if no PO created yet
}

export interface PurchaseRequestSummaryResponse {
  id: number;
  requestNumber: string;
  dtype: string;
  projectId: number | null;
  jobCode: string | null;
  // Service-specific fields
  serviceCategoryId: number | null;
  serviceCategoryName: string | null;
  // Material-specific fields
  materialId: number | null;
  materialName: string | null;
  materialSku: string | null;
  // Common fields
  itemName: string;
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
  dtype: string;
  projectId: number | null;
  jobCode: string | null;
  projectName: string | null;
  // Service-specific fields
  serviceCategoryId: number | null;
  serviceCategoryName: string | null;
  // Material-specific fields
  materialId: number | null;
  materialName: string | null;
  materialSku: string | null;
  materialCategoryId: number | null;
  materialCategoryName: string | null;
  materialStandardPrice: number | null;
  // Common fields
  itemName: string;
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
  dtype?: PurchaseRequestType;
}

// =============================================================================
// MAPPERS
// =============================================================================

const rfqItemMapper = {
  toDomain(response: RfqItemResponse): RfqItem {
    return {
      itemId: response.itemId,
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
      purchaseOrderId: response.purchaseOrderId,
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
      dtype: response.dtype as PurchaseRequestType,
      projectId: response.projectId,
      jobCode: response.jobCode,
      projectName: response.projectName?.trim() ?? null,
      // Service-specific fields
      serviceCategoryId: response.serviceCategoryId,
      serviceCategoryName: response.serviceCategoryName?.trim() ?? null,
      // Material-specific fields
      materialId: response.materialId,
      materialName: response.materialName?.trim() ?? null,
      materialSku: response.materialSku,
      materialCategoryId: response.materialCategoryId,
      materialCategoryName: response.materialCategoryName?.trim() ?? null,
      materialStandardPrice: response.materialStandardPrice,
      // Common fields
      itemName: response.itemName.trim(),
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
      dtype: response.dtype as PurchaseRequestType,
      projectId: response.projectId,
      jobCode: response.jobCode,
      // Service-specific fields
      serviceCategoryId: response.serviceCategoryId,
      serviceCategoryName: response.serviceCategoryName?.trim() ?? null,
      // Material-specific fields
      materialId: response.materialId,
      materialName: response.materialName?.trim() ?? null,
      materialSku: response.materialSku,
      // Common fields
      itemName: response.itemName.trim(),
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
