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

import { isPast, getNow } from '@/shared/lib/formatting';
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
};
