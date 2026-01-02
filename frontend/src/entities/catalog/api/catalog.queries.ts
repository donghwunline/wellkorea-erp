/**
 * Catalog Query Factory.
 *
 * TanStack Query v5 query options factory.
 * Use with useQuery() directly - no custom hooks needed.
 *
 * @example
 * ```typescript
 * // List categories with pagination
 * const { data } = useQuery(catalogQueries.categoryList({ page: 0, size: 20 }));
 *
 * // Get category detail
 * const { data } = useQuery(catalogQueries.categoryDetail(id));
 *
 * // Get all categories for dropdown
 * const { data } = useQuery(catalogQueries.allCategories());
 *
 * // Get current offerings for a category
 * const { data } = useQuery(catalogQueries.currentOfferings(categoryId));
 * ```
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { Paginated } from '@/shared/api/types';
import type { ServiceCategory, ServiceCategoryListItem } from '../model/service-category';
import type { VendorOffering } from '../model/vendor-offering';
import {
  getServiceCategories,
  getAllServiceCategories,
  getServiceCategory,
  getOfferingsForCategory,
  getCurrentOfferingsForCategory,
  getVendorOffering,
} from './get-catalog';

// =============================================================================
// Query Parameters
// =============================================================================

export interface ServiceCategoryListQueryParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface VendorOfferingListQueryParams {
  page?: number;
  size?: number;
}

// =============================================================================
// Query Factory
// =============================================================================

export const catalogQueries = {
  // -------------------------------------------------------------------------
  // Query Keys
  // -------------------------------------------------------------------------

  /** Base key for all catalog queries */
  all: () => ['catalog'] as const,

  /** Key for category queries */
  categories: () => [...catalogQueries.all(), 'categories'] as const,

  /** Key for category list queries */
  categoryLists: () => [...catalogQueries.categories(), 'list'] as const,

  /** Key for category detail queries */
  categoryDetails: () => [...catalogQueries.categories(), 'detail'] as const,

  /** Key for offering queries */
  offerings: () => [...catalogQueries.all(), 'offerings'] as const,

  /** Key for offerings by category */
  offeringsByCategory: (categoryId: number) =>
    [...catalogQueries.offerings(), 'byCategory', categoryId] as const,

  // -------------------------------------------------------------------------
  // Service Category Queries
  // -------------------------------------------------------------------------

  /**
   * Query options for paginated service category list.
   */
  categoryList: (params: ServiceCategoryListQueryParams = {}) =>
    queryOptions({
      queryKey: [
        ...catalogQueries.categoryLists(),
        params.page ?? 0,
        params.size ?? 20,
        params.search ?? '',
      ] as const,
      queryFn: async (): Promise<Paginated<ServiceCategoryListItem>> => {
        return getServiceCategories({
          page: params.page ?? 0,
          size: params.size ?? 20,
          search: params.search,
        });
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Query options for all service categories (dropdown).
   */
  allCategories: () =>
    queryOptions({
      queryKey: [...catalogQueries.categories(), 'all'] as const,
      queryFn: async (): Promise<ServiceCategoryListItem[]> => {
        return getAllServiceCategories();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes - categories change rarely
    }),

  /**
   * Query options for service category detail.
   */
  categoryDetail: (id: number) =>
    queryOptions({
      queryKey: [...catalogQueries.categoryDetails(), id] as const,
      queryFn: async (): Promise<ServiceCategory> => {
        return getServiceCategory(id);
      },
      enabled: id > 0,
    }),

  // -------------------------------------------------------------------------
  // Vendor Offering Queries
  // -------------------------------------------------------------------------

  /**
   * Query options for paginated vendor offerings by category.
   */
  offeringList: (categoryId: number, params: VendorOfferingListQueryParams = {}) =>
    queryOptions({
      queryKey: [
        ...catalogQueries.offeringsByCategory(categoryId),
        'list',
        params.page ?? 0,
        params.size ?? 20,
      ] as const,
      queryFn: async (): Promise<Paginated<VendorOffering>> => {
        return getOfferingsForCategory(categoryId, {
          page: params.page ?? 0,
          size: params.size ?? 20,
        });
      },
      placeholderData: keepPreviousData,
      enabled: categoryId > 0,
    }),

  /**
   * Query options for current (effective) vendor offerings by category.
   */
  currentOfferings: (categoryId: number) =>
    queryOptions({
      queryKey: [...catalogQueries.offeringsByCategory(categoryId), 'current'] as const,
      queryFn: async (): Promise<VendorOffering[]> => {
        return getCurrentOfferingsForCategory(categoryId);
      },
      enabled: categoryId > 0,
    }),

  /**
   * Query options for vendor offering detail.
   */
  offeringDetail: (id: number) =>
    queryOptions({
      queryKey: [...catalogQueries.offerings(), 'detail', id] as const,
      queryFn: async (): Promise<VendorOffering> => {
        return getVendorOffering(id);
      },
      enabled: id > 0,
    }),
};
