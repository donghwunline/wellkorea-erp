/**
 * Purchase Request domain model.
 *
 * Represents a request for purchasing services/materials from vendors.
 * Supports two types:
 * - SERVICE: Outsourcing services (linked to ServiceCategory)
 * - MATERIAL: Physical materials (linked to Material)
 *
 * Dates are stored as ISO strings for React Query cache serialization.
 */

import { getNow, isPast } from '@/shared/lib/formatting';
import type { RfqItem } from './rfq-item';
import type { StatusConfig } from './purchase-request-status';
import { PurchaseRequestStatus, PurchaseRequestStatusConfig } from './purchase-request-status';

/**
 * Purchase request type discriminator.
 */
export type PurchaseRequestType = 'SERVICE' | 'MATERIAL';

/**
 * Purchase request domain model (plain interface).
 * Supports both service and material types via dtype discriminator.
 */
export interface PurchaseRequest {
  readonly id: number;
  readonly requestNumber: string;
  readonly dtype: PurchaseRequestType;
  readonly projectId: number | null;
  readonly jobCode: string | null;
  readonly projectName: string | null;
  // Service-specific fields (null for materials)
  readonly serviceCategoryId: number | null;
  readonly serviceCategoryName: string | null;
  // Material-specific fields (null for services)
  readonly materialId: number | null;
  readonly materialName: string | null;
  readonly materialSku: string | null;
  readonly materialCategoryId: number | null;
  readonly materialCategoryName: string | null;
  readonly materialStandardPrice: number | null;
  // Common computed field
  readonly itemName: string; // serviceCategoryName or materialName
  // Common fields
  readonly description: string;
  readonly quantity: number;
  readonly uom: string; // Unit of measure
  readonly requiredDate: string; // ISO date: "2025-02-15"
  readonly status: PurchaseRequestStatus;
  /**
   * UUID of the RFQ item awaiting manager approval for vendor selection.
   * Only populated when status is PENDING_VENDOR_APPROVAL.
   * References an RfqItem by its itemId field.
   * Null when no approval is pending or after approval completes.
   */
  readonly pendingSelectedRfqItemId: string | null;
  readonly createdById: number;
  readonly createdByName: string;
  readonly createdAt: string; // ISO datetime
  readonly updatedAt: string; // ISO datetime
  readonly rfqItems: readonly RfqItem[];
}

/**
 * Purchase request summary for list views.
 */
export interface PurchaseRequestListItem {
  readonly id: number;
  readonly requestNumber: string;
  readonly dtype: PurchaseRequestType;
  readonly projectId: number | null;
  readonly jobCode: string | null;
  // Service-specific fields
  readonly serviceCategoryId: number | null;
  readonly serviceCategoryName: string | null;
  // Material-specific fields
  readonly materialId: number | null;
  readonly materialName: string | null;
  readonly materialSku: string | null;
  // Common fields
  readonly itemName: string;
  readonly description: string;
  readonly quantity: number;
  readonly uom: string;
  readonly requiredDate: string;
  readonly status: PurchaseRequestStatus;
  /**
   * UUID of RFQ item pending vendor approval (null if not applicable).
   */
  readonly pendingSelectedRfqItemId: string | null;
  readonly createdByName: string;
  readonly createdAt: string;
}

/**
 * Base type for rules that work with both full and summary.
 */
type PurchaseRequestBase = Pick<PurchaseRequest, 'id' | 'status' | 'requiredDate' | 'dtype'>;

/**
 * Purchase request business rules (read-only focused).
 */
export const purchaseRequestRules = {
  // ==================== TYPE CHECKS ====================

  /**
   * Check if request is for a service (outsourcing).
   */
  isService(request: Pick<PurchaseRequest, 'dtype'>): boolean {
    return request.dtype === 'SERVICE';
  },

  /**
   * Check if request is for a material (physical item).
   */
  isMaterial(request: Pick<PurchaseRequest, 'dtype'>): boolean {
    return request.dtype === 'MATERIAL';
  },

  // ==================== COMPUTED VALUES ====================

  /**
   * Get status display configuration.
   */
  getStatusConfig(request: Pick<PurchaseRequest, 'status'>): StatusConfig {
    return PurchaseRequestStatusConfig[request.status];
  },

  /**
   * Check if required date is overdue.
   */
  isOverdue(request: PurchaseRequestBase, now: Date = getNow()): boolean {
    return (
      isPast(request.requiredDate, now) &&
      request.status !== PurchaseRequestStatus.CLOSED &&
      request.status !== PurchaseRequestStatus.CANCELED
    );
  },

  /**
   * Get number of RFQ items.
   */
  getRfqItemCount(request: PurchaseRequest): number {
    return request.rfqItems.length;
  },

  /**
   * Get number of quotes received.
   */
  getQuoteCount(request: PurchaseRequest): number {
    return request.rfqItems.filter(
      item => item.status === 'REPLIED' || item.status === 'SELECTED'
    ).length;
  },

  /**
   * Get type label in Korean.
   */
  getTypeLabel(request: Pick<PurchaseRequest, 'dtype'>): string {
    return request.dtype === 'SERVICE' ? '외주' : '자재';
  },

  // ==================== BUSINESS RULES ====================

  /**
   * Check if request can be viewed in detail.
   */
  canViewDetails(/* request */): boolean {
    return true; // All requests can be viewed (read-only)
  },

  /**
   * Check if request has quotes to compare.
   */
  hasQuotesToCompare(request: PurchaseRequest): boolean {
    return purchaseRequestRules.getQuoteCount(request) > 0;
  },

  /**
   * Check if request is pending vendor approval.
   */
  isPendingVendorApproval(request: Pick<PurchaseRequest, 'status'>): boolean {
    return request.status === PurchaseRequestStatus.PENDING_VENDOR_APPROVAL;
  },

  /**
   * Check if vendor selection can be submitted for approval.
   * Only allowed in RFQ_SENT status with at least one REPLIED RFQ item.
   */
  canSubmitVendorSelection(request: PurchaseRequest): boolean {
    return (
      request.status === PurchaseRequestStatus.RFQ_SENT &&
      request.rfqItems.some(item => item.status === 'REPLIED')
    );
  },

  /**
   * Get the RFQ item pending vendor approval.
   * Returns null if not in PENDING_VENDOR_APPROVAL status or no pending item.
   */
  getPendingRfqItem(request: PurchaseRequest): RfqItem | null {
    if (!request.pendingSelectedRfqItemId) return null;
    return request.rfqItems.find(
      item => item.itemId === request.pendingSelectedRfqItemId
    ) ?? null;
  },
};
