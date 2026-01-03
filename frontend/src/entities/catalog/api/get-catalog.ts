/**
 * Catalog API functions for data fetching.
 *
 * Internal functions used by query factory.
 * These should NOT be exported from the entity's public API.
 */

import { httpClient, SERVICE_CATEGORY_ENDPOINTS, type PagedResponse } from '@/shared/api';
import type { Paginated } from '@/shared/lib/pagination';
import type { ServiceCategory, ServiceCategoryListItem } from '../model/service-category';
import type { VendorOffering } from '../model/vendor-offering';
import type {
  ServiceCategorySummaryDTO,
  ServiceCategoryDetailsDTO,
  VendorOfferingDTO,
} from './catalog.dto';
import {
  toServiceCategory,
  toServiceCategoryListItem,
  toVendorOffering,
} from './catalog.mapper';

// =============================================================================
// Service Category Query Functions
// =============================================================================

/**
 * Get paginated list of service categories.
 */
export async function getServiceCategories(params: {
  page?: number;
  size?: number;
  search?: string;
}): Promise<Paginated<ServiceCategoryListItem>> {
  const response = await httpClient.requestWithMeta<PagedResponse<ServiceCategorySummaryDTO>>({
    method: 'GET',
    url: SERVICE_CATEGORY_ENDPOINTS.BASE,
    params: {
      page: params.page,
      size: params.size,
      search: params.search || undefined,
    },
  });

  return {
    data: response.data.content.map(toServiceCategoryListItem),
    pagination: {
      page: response.data.number,
      size: response.data.size,
      totalElements: response.data.totalElements,
      totalPages: response.data.totalPages,
      first: response.data.first,
      last: response.data.last,
    },
  };
}

/**
 * Get all service categories for dropdown.
 */
export async function getAllServiceCategories(): Promise<ServiceCategoryListItem[]> {
  const data = await httpClient.get<ServiceCategorySummaryDTO[]>(SERVICE_CATEGORY_ENDPOINTS.all);
  return data.map(toServiceCategoryListItem);
}

/**
 * Get service category by ID.
 */
export async function getServiceCategory(id: number): Promise<ServiceCategory> {
  const dto = await httpClient.get<ServiceCategoryDetailsDTO>(SERVICE_CATEGORY_ENDPOINTS.byId(id));
  return toServiceCategory(dto);
}

// =============================================================================
// Vendor Offering Query Functions
// =============================================================================

/**
 * Get paginated vendor offerings for a service category.
 */
export async function getOfferingsForCategory(
  serviceCategoryId: number,
  params?: { page?: number; size?: number }
): Promise<Paginated<VendorOffering>> {
  const response = await httpClient.requestWithMeta<PagedResponse<VendorOfferingDTO>>({
    method: 'GET',
    url: SERVICE_CATEGORY_ENDPOINTS.offerings(serviceCategoryId),
    params,
  });

  return {
    data: response.data.content.map(toVendorOffering),
    pagination: {
      page: response.data.number,
      size: response.data.size,
      totalElements: response.data.totalElements,
      totalPages: response.data.totalPages,
      first: response.data.first,
      last: response.data.last,
    },
  };
}

/**
 * Get current (effective) vendor offerings for a service category.
 */
export async function getCurrentOfferingsForCategory(
  serviceCategoryId: number
): Promise<VendorOffering[]> {
  const data = await httpClient.get<VendorOfferingDTO[]>(
    SERVICE_CATEGORY_ENDPOINTS.currentOfferings(serviceCategoryId)
  );
  return data.map(toVendorOffering);
}

/**
 * Get vendor offering by ID.
 */
export async function getVendorOffering(id: number): Promise<VendorOffering> {
  const dto = await httpClient.get<VendorOfferingDTO>(SERVICE_CATEGORY_ENDPOINTS.offering(id));
  return toVendorOffering(dto);
}
