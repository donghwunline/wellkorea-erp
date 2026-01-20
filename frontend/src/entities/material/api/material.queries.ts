/**
 * Material Query Factory.
 *
 * TanStack Query v5 query options factory.
 * Use with useQuery() directly - no custom hooks needed.
 *
 * @example
 * ```typescript
 * // List materials with pagination
 * const { data } = useQuery(materialQueries.list({ page: 0, size: 20 }));
 *
 * // Get material detail
 * const { data } = useQuery(materialQueries.detail(id));
 *
 * // Get all categories for dropdown
 * const { data } = useQuery(materialQueries.categoryList());
 * ```
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { Paginated } from '@/shared/lib/pagination';
import type { Material, MaterialListItem } from '../model/material';
import type { MaterialCategory, MaterialCategoryListItem } from '../model/material-category';
import type { VendorMaterialOffering } from '../model/vendor-material-offering';
import {
  getMaterials,
  getAllMaterials,
  getMaterial,
  getMaterialCategories,
  getAllMaterialCategories,
  getMaterialCategory,
  getCurrentOfferingsForMaterial,
  getOfferingsForMaterial,
} from './get-material';

// =============================================================================
// Query Parameters
// =============================================================================

export interface MaterialListQueryParams {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: number;
  activeOnly?: boolean;
}

export interface MaterialCategoryListQueryParams {
  page?: number;
  size?: number;
  search?: string;
  activeOnly?: boolean;
}

// =============================================================================
// Query Factory
// =============================================================================

export const materialQueries = {
  // -------------------------------------------------------------------------
  // Query Keys
  // -------------------------------------------------------------------------

  /** Base key for all material queries */
  all: () => ['materials'] as const,

  /** Key for material list queries */
  lists: () => [...materialQueries.all(), 'list'] as const,

  /** Key for material detail queries */
  details: () => [...materialQueries.all(), 'detail'] as const,

  /** Key for category queries */
  categories: () => [...materialQueries.all(), 'categories'] as const,

  /** Key for category list queries */
  categoryLists: () => [...materialQueries.categories(), 'list'] as const,

  /** Key for vendor offering queries */
  offerings: () => [...materialQueries.all(), 'offerings'] as const,

  /** Key for offerings by material */
  offeringsByMaterial: (materialId: number) =>
    [...materialQueries.offerings(), 'byMaterial', materialId] as const,

  // -------------------------------------------------------------------------
  // Material Queries
  // -------------------------------------------------------------------------

  /**
   * Query options for paginated material list.
   */
  list: (params: MaterialListQueryParams = {}) =>
    queryOptions({
      queryKey: [
        ...materialQueries.lists(),
        params.page ?? 0,
        params.size ?? 20,
        params.search ?? '',
        params.categoryId ?? null,
        params.activeOnly ?? true,
      ] as const,
      queryFn: async (): Promise<Paginated<MaterialListItem>> => {
        return getMaterials(params);
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Query options for all materials (dropdown).
   */
  allMaterials: () =>
    queryOptions({
      queryKey: [...materialQueries.all(), 'all'] as const,
      queryFn: async (): Promise<MaterialListItem[]> => {
        return getAllMaterials();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes - materials change rarely
    }),

  /**
   * Query options for material detail.
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...materialQueries.details(), id] as const,
      queryFn: async (): Promise<Material> => {
        return getMaterial(id);
      },
      enabled: id > 0,
    }),

  // -------------------------------------------------------------------------
  // Material Category Queries
  // -------------------------------------------------------------------------

  /**
   * Query options for paginated material category list.
   */
  categoryListPaginated: (params: MaterialCategoryListQueryParams = {}) =>
    queryOptions({
      queryKey: [
        ...materialQueries.categoryLists(),
        params.page ?? 0,
        params.size ?? 20,
        params.search ?? '',
        params.activeOnly ?? true,
      ] as const,
      queryFn: async (): Promise<Paginated<MaterialCategoryListItem>> => {
        return getMaterialCategories(params);
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Query options for all material categories (dropdown).
   */
  categoryList: () =>
    queryOptions({
      queryKey: [...materialQueries.categories(), 'all'] as const,
      queryFn: async (): Promise<MaterialCategoryListItem[]> => {
        return getAllMaterialCategories();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes - categories change rarely
    }),

  /**
   * Query options for material category detail.
   */
  categoryDetail: (id: number) =>
    queryOptions({
      queryKey: [...materialQueries.categories(), 'detail', id] as const,
      queryFn: async (): Promise<MaterialCategory> => {
        return getMaterialCategory(id);
      },
      enabled: id > 0,
    }),

  // -------------------------------------------------------------------------
  // Vendor Material Offering Queries
  // -------------------------------------------------------------------------

  /**
   * Query options for current (effective) vendor offerings by material.
   */
  currentOfferings: (materialId: number) =>
    queryOptions({
      queryKey: [...materialQueries.offeringsByMaterial(materialId), 'current'] as const,
      queryFn: async (): Promise<VendorMaterialOffering[]> => {
        return getCurrentOfferingsForMaterial(materialId);
      },
      enabled: materialId > 0,
    }),

  /**
   * Query options for paginated vendor offerings by material.
   */
  offeringList: (materialId: number, params: { page?: number; size?: number } = {}) =>
    queryOptions({
      queryKey: [
        ...materialQueries.offeringsByMaterial(materialId),
        'list',
        params.page ?? 0,
        params.size ?? 20,
      ] as const,
      queryFn: async (): Promise<Paginated<VendorMaterialOffering>> => {
        return getOfferingsForMaterial(materialId, params);
      },
      placeholderData: keepPreviousData,
      enabled: materialId > 0,
    }),
};
