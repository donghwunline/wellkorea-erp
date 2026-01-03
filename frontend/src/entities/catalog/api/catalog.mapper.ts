/**
 * Catalog Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 */

import type { ServiceCategory, ServiceCategoryListItem } from '../model/service-category';
import type { VendorOffering } from '../model/vendor-offering';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Service category summary response from API.
 */
export interface ServiceCategorySummaryResponse {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  vendorCount: number;
}

/**
 * Service category details response from API.
 */
export interface ServiceCategoryDetailsResponse {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  vendorCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor service offering response from API.
 */
export interface VendorOfferingResponse {
  id: number;
  vendorId: number;
  vendorName: string;
  serviceCategoryId: number;
  serviceCategoryName: string;
  vendorServiceCode?: string | null;
  vendorServiceName?: string | null;
  unitPrice?: number | null;
  currency: string;
  leadTimeDays?: number | null;
  minOrderQuantity?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPreferred: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Command result for catalog operations.
 */
export interface CommandResult {
  id: number;
  message: string;
}

// =============================================================================
// MAPPERS
// =============================================================================

/**
 * Map service category summary response to domain list item.
 */
export function toServiceCategoryListItem(response: ServiceCategorySummaryResponse): ServiceCategoryListItem {
  return {
    id: response.id,
    name: response.name,
    description: response.description ?? null,
    isActive: response.isActive,
    vendorCount: response.vendorCount,
  };
}

/**
 * Map service category details response to full domain model.
 */
export function toServiceCategory(response: ServiceCategoryDetailsResponse): ServiceCategory {
  return {
    id: response.id,
    name: response.name,
    description: response.description ?? null,
    isActive: response.isActive,
    vendorCount: response.vendorCount,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

/**
 * Map vendor offering response to domain model.
 */
export function toVendorOffering(response: VendorOfferingResponse): VendorOffering {
  return {
    id: response.id,
    vendorId: response.vendorId,
    vendorName: response.vendorName,
    serviceCategoryId: response.serviceCategoryId,
    serviceCategoryName: response.serviceCategoryName,
    vendorServiceCode: response.vendorServiceCode ?? null,
    vendorServiceName: response.vendorServiceName ?? null,
    unitPrice: response.unitPrice ?? null,
    currency: response.currency,
    leadTimeDays: response.leadTimeDays ?? null,
    minOrderQuantity: response.minOrderQuantity ?? null,
    effectiveFrom: response.effectiveFrom ?? null,
    effectiveTo: response.effectiveTo ?? null,
    isPreferred: response.isPreferred,
    notes: response.notes ?? null,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}
