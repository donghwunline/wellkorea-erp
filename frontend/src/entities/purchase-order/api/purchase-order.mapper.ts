/**
 * Purchase Order Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 */

import type { PurchaseOrder, PurchaseOrderListItem } from '../model/purchase-order';
import type { PurchaseOrderStatus } from '../model/purchase-order-status';

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

export interface PurchaseOrderSummaryResponse {
  id: number;
  poNumber: string;
  rfqItemId: string; // UUID string
  purchaseRequestId: number;
  projectId: number;
  jobCode: string;
  vendorId: number;
  vendorName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdByName: string;
  createdAt: string;
}

export interface PurchaseOrderDetailResponse {
  id: number;
  poNumber: string;
  rfqItemId: string; // UUID string
  purchaseRequestId: number;
  purchaseRequestNumber: string;
  projectId: number;
  jobCode: string;
  projectName: string;
  vendorId: number;
  vendorName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  totalAmount: number;
  currency: string;
  status: string;
  notes: string | null;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderListParams {
  page?: number;
  size?: number;
  status?: string;
  projectId?: number;
  vendorId?: number;
}

// =============================================================================
// MAPPERS
// =============================================================================

export const purchaseOrderMapper = {
  /**
   * Map API response to domain model.
   */
  toDomain(response: PurchaseOrderDetailResponse): PurchaseOrder {
    return {
      id: response.id,
      poNumber: response.poNumber,
      rfqItemId: response.rfqItemId,
      purchaseRequestId: response.purchaseRequestId,
      purchaseRequestNumber: response.purchaseRequestNumber,
      projectId: response.projectId,
      jobCode: response.jobCode,
      projectName: response.projectName.trim(),
      vendorId: response.vendorId,
      vendorName: response.vendorName.trim(),
      orderDate: response.orderDate,
      expectedDeliveryDate: response.expectedDeliveryDate,
      totalAmount: response.totalAmount,
      currency: response.currency,
      status: response.status as PurchaseOrderStatus,
      notes: response.notes?.trim() ?? null,
      createdById: response.createdById,
      createdByName: response.createdByName.trim(),
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  },

  /**
   * Map summary response directly to list item (optimized for lists).
   */
  summaryToListItem(response: PurchaseOrderSummaryResponse): PurchaseOrderListItem {
    return {
      id: response.id,
      poNumber: response.poNumber,
      purchaseRequestId: response.purchaseRequestId,
      rfqItemId: response.rfqItemId,
      projectId: response.projectId,
      jobCode: response.jobCode,
      vendorId: response.vendorId,
      vendorName: response.vendorName.trim(),
      orderDate: response.orderDate,
      expectedDeliveryDate: response.expectedDeliveryDate,
      totalAmount: response.totalAmount,
      currency: response.currency,
      status: response.status as PurchaseOrderStatus,
      createdByName: response.createdByName.trim(),
      createdAt: response.createdAt,
    };
  },
};
