/**
 * Catalog DTO to Domain mappers.
 *
 * Internal functions for mapping API responses to domain types.
 * These should NOT be exported from the entity's public API.
 */

import type { ServiceCategory, ServiceCategoryListItem } from '../model/service-category';
import type { VendorOffering } from '../model/vendor-offering';
import type {
  ServiceCategorySummaryDTO,
  ServiceCategoryDetailsDTO,
  VendorOfferingDTO,
} from './catalog.dto';

// =============================================================================
// Service Category Mappers
// =============================================================================

/**
 * Map service category summary DTO to domain list item.
 */
export function toServiceCategoryListItem(dto: ServiceCategorySummaryDTO): ServiceCategoryListItem {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? null,
    isActive: dto.isActive,
    vendorCount: dto.vendorCount,
  };
}

/**
 * Map service category details DTO to full domain model.
 */
export function toServiceCategory(dto: ServiceCategoryDetailsDTO): ServiceCategory {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? null,
    isActive: dto.isActive,
    vendorCount: dto.vendorCount,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

// =============================================================================
// Vendor Offering Mappers
// =============================================================================

/**
 * Map vendor offering DTO to domain model.
 */
export function toVendorOffering(dto: VendorOfferingDTO): VendorOffering {
  return {
    id: dto.id,
    vendorId: dto.vendorId,
    vendorName: dto.vendorName,
    serviceCategoryId: dto.serviceCategoryId,
    serviceCategoryName: dto.serviceCategoryName,
    vendorServiceCode: dto.vendorServiceCode ?? null,
    vendorServiceName: dto.vendorServiceName ?? null,
    unitPrice: dto.unitPrice ?? null,
    currency: dto.currency,
    leadTimeDays: dto.leadTimeDays ?? null,
    minOrderQuantity: dto.minOrderQuantity ?? null,
    effectiveFrom: dto.effectiveFrom ?? null,
    effectiveTo: dto.effectiveTo ?? null,
    isPreferred: dto.isPreferred,
    notes: dto.notes ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
