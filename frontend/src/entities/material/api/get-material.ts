/**
 * Material GET Operations.
 *
 * INTERNAL: Used by materialQueries. Not exported from entity public API.
 */

import { httpClient, type PagedResponse } from '@/shared/api';
import { MATERIAL_ENDPOINTS } from '@/shared/config/endpoints';
import { transformPagedResponse, type Paginated } from '@/shared/lib/pagination';
import type { Material, MaterialListItem } from '../model/material';
import type { MaterialCategory, MaterialCategoryListItem } from '../model/material-category';
import type { VendorMaterialOffering } from '../model/vendor-material-offering';
import {
  type MaterialResponse,
  type MaterialCategoryResponse,
  type VendorMaterialOfferingResponse,
  mapMaterial,
  mapMaterialListItem,
  mapMaterialCategory,
  mapMaterialCategoryListItem,
  mapVendorMaterialOffering,
} from './material.mapper';

// =============================================================================
// MATERIAL QUERIES
// =============================================================================

export interface GetMaterialsParams {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: number;
  activeOnly?: boolean;
}

/**
 * Get paginated list of materials.
 */
export async function getMaterials(params: GetMaterialsParams = {}): Promise<Paginated<MaterialListItem>> {
  const { page = 0, size = 20, search, categoryId, activeOnly = true } = params;

  const queryParams: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
    activeOnly: activeOnly.toString(),
  };
  if (search) queryParams.search = search;
  if (categoryId) queryParams.categoryId = categoryId.toString();

  const response = await httpClient.requestWithMeta<PagedResponse<MaterialResponse>>({
    method: 'GET',
    url: MATERIAL_ENDPOINTS.BASE,
    params: queryParams,
  });

  const paginated = transformPagedResponse(response.data, response.metadata);
  return {
    data: paginated.data.map(mapMaterialListItem),
    pagination: paginated.pagination,
  };
}

/**
 * Get all active materials (for dropdown).
 */
export async function getAllMaterials(): Promise<MaterialListItem[]> {
  const response = await httpClient.request<MaterialResponse[]>({
    method: 'GET',
    url: MATERIAL_ENDPOINTS.all,
  });
  return response.map(mapMaterialListItem);
}

/**
 * Get material by ID.
 */
export async function getMaterial(id: number): Promise<Material> {
  const response = await httpClient.request<MaterialResponse>({
    method: 'GET',
    url: MATERIAL_ENDPOINTS.byId(id),
  });
  return mapMaterial(response);
}

// =============================================================================
// MATERIAL CATEGORY QUERIES
// =============================================================================

export interface GetMaterialCategoriesParams {
  page?: number;
  size?: number;
  search?: string;
  activeOnly?: boolean;
}

/**
 * Get paginated list of material categories.
 */
export async function getMaterialCategories(params: GetMaterialCategoriesParams = {}): Promise<Paginated<MaterialCategoryListItem>> {
  const { page = 0, size = 20, search, activeOnly = true } = params;

  const queryParams: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
    activeOnly: activeOnly.toString(),
  };
  if (search) queryParams.search = search;

  const response = await httpClient.requestWithMeta<PagedResponse<MaterialCategoryResponse>>({
    method: 'GET',
    url: MATERIAL_ENDPOINTS.categories,
    params: queryParams,
  });

  const paginated = transformPagedResponse(response.data, response.metadata);
  return {
    data: paginated.data.map(mapMaterialCategoryListItem),
    pagination: paginated.pagination,
  };
}

/**
 * Get all active material categories (for dropdown).
 */
export async function getAllMaterialCategories(): Promise<MaterialCategoryListItem[]> {
  const response = await httpClient.request<MaterialCategoryResponse[]>({
    method: 'GET',
    url: MATERIAL_ENDPOINTS.allCategories,
  });
  return response.map(mapMaterialCategoryListItem);
}

/**
 * Get material category by ID.
 */
export async function getMaterialCategory(id: number): Promise<MaterialCategory> {
  const response = await httpClient.request<MaterialCategoryResponse>({
    method: 'GET',
    url: MATERIAL_ENDPOINTS.category(id),
  });
  return mapMaterialCategory(response);
}

// =============================================================================
// VENDOR MATERIAL OFFERING QUERIES
// =============================================================================

/**
 * Get current (effective) vendor offerings for a material.
 * Only includes offerings within their effective date range.
 */
export async function getCurrentOfferingsForMaterial(materialId: number): Promise<VendorMaterialOffering[]> {
  const response = await httpClient.request<VendorMaterialOfferingResponse[]>({
    method: 'GET',
    url: MATERIAL_ENDPOINTS.currentOfferings(materialId),
  });
  return response.map(mapVendorMaterialOffering);
}

/**
 * Get paginated list of vendor offerings for a material.
 */
export async function getOfferingsForMaterial(
  materialId: number,
  params: { page?: number; size?: number } = {}
): Promise<Paginated<VendorMaterialOffering>> {
  const { page = 0, size = 20 } = params;

  const response = await httpClient.requestWithMeta<PagedResponse<VendorMaterialOfferingResponse>>({
    method: 'GET',
    url: MATERIAL_ENDPOINTS.offerings(materialId),
    params: {
      page: page.toString(),
      size: size.toString(),
    },
  });

  const paginated = transformPagedResponse(response.data, response.metadata);
  return {
    data: paginated.data.map(mapVendorMaterialOffering),
    pagination: paginated.pagination,
  };
}
