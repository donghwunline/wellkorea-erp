/**
 * Catalog DTO types.
 *
 * Internal types for API communication.
 * These should NOT be exported from the entity's public API.
 * Use domain types (ServiceCategory, VendorOffering) in components.
 */

// =============================================================================
// Service Category DTOs
// =============================================================================

/**
 * Service category summary response from API.
 */
export interface ServiceCategorySummaryDTO {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  vendorCount: number;
}

/**
 * Service category details response from API.
 */
export interface ServiceCategoryDetailsDTO {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  vendorCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request to create a new service category.
 */
export interface CreateServiceCategoryRequestDTO {
  name: string;
  description?: string | null;
}

/**
 * Request to update a service category.
 */
export interface UpdateServiceCategoryRequestDTO {
  name?: string | null;
  description?: string | null;
  isActive?: boolean | null;
}

// =============================================================================
// Vendor Offering DTOs
// =============================================================================

/**
 * Vendor service offering response from API.
 */
export interface VendorOfferingDTO {
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
 * Request to create a vendor service offering.
 */
export interface CreateVendorOfferingRequestDTO {
  vendorId: number;
  serviceCategoryId: number;
  vendorServiceCode?: string | null;
  vendorServiceName?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  leadTimeDays?: number | null;
  minOrderQuantity?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPreferred?: boolean;
  notes?: string | null;
}

/**
 * Request to update a vendor service offering.
 */
export interface UpdateVendorOfferingRequestDTO {
  vendorServiceCode?: string | null;
  vendorServiceName?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  leadTimeDays?: number | null;
  minOrderQuantity?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPreferred?: boolean | null;
  notes?: string | null;
}

// =============================================================================
// Command Result DTOs
// =============================================================================

/**
 * Command result for catalog operations.
 */
export interface CommandResult {
  id: number;
  message: string;
}
