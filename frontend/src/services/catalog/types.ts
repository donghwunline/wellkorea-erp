/**
 * Catalog service types.
 * Matches backend Catalog domain DTOs (ServiceCategory, VendorServiceOffering).
 */

import type { Paginated } from '@/shared/api/types';

// ============================================================================
// Service Category Types
// ============================================================================

/**
 * Service category summary for list views.
 */
export interface ServiceCategorySummary {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  vendorCount: number;
}

/**
 * Full service category details.
 */
export interface ServiceCategoryDetails {
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
export interface CreateServiceCategoryRequest {
  name: string;
  description?: string | null;
}

/**
 * Request to update a service category.
 */
export interface UpdateServiceCategoryRequest {
  name?: string | null;
  description?: string | null;
  isActive?: boolean | null;
}

/**
 * Command result for service category operations.
 */
export interface ServiceCategoryCommandResult {
  id: number;
  message: string;
}

/**
 * Parameters for listing service categories.
 */
export interface ServiceCategoryListParams {
  page?: number;
  size?: number;
  search?: string;
}

/**
 * Paginated service category response.
 */
export type PaginatedServiceCategories = Paginated<ServiceCategorySummary>;

// ============================================================================
// Vendor Service Offering Types
// ============================================================================

/**
 * Vendor service offering view.
 */
export interface VendorServiceOffering {
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
export interface CreateVendorOfferingRequest {
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
export interface UpdateVendorOfferingRequest {
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

/**
 * Command result for vendor offering operations.
 */
export interface VendorOfferingCommandResult {
  id: number;
  message: string;
}

/**
 * Parameters for listing vendor offerings.
 */
export interface VendorOfferingListParams {
  page?: number;
  size?: number;
}

/**
 * Paginated vendor offerings response.
 */
export type PaginatedVendorOfferings = Paginated<VendorServiceOffering>;
