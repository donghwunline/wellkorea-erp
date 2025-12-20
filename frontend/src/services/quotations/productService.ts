/**
 * Product catalog service.
 * Business logic layer for product search and retrieval.
 *
 * Features:
 * - Product search
 * - Product details
 */

import { httpClient, PRODUCT_ENDPOINTS } from '@/api';
import type { PagedResponse } from '@/api/types';
import { transformPagedResponse } from '@/services/shared';
import type { PaginatedProducts, ProductSearchParams, ProductSearchResult } from './types';

/**
 * Transform ProductSearchResult DTO.
 * Normalizes data from API response.
 */
function transformProduct(dto: ProductSearchResult): ProductSearchResult {
  return {
    ...dto,
    name: dto.name?.trim() ?? '',
    sku: dto.sku?.trim() ?? '',
    description: dto.description?.trim() ?? null,
    productTypeName: dto.productTypeName?.trim() ?? null,
    unit: dto.unit?.trim() ?? null,
  };
}

/**
 * Product catalog service.
 */
export const productService = {
  /**
   * Search products.
   * Returns paginated list matching search criteria.
   */
  async searchProducts(params?: ProductSearchParams): Promise<PaginatedProducts> {
    const response = await httpClient.requestWithMeta<PagedResponse<ProductSearchResult>>({
      method: 'GET',
      url: PRODUCT_ENDPOINTS.BASE,
      params,
    });

    const paginated = transformPagedResponse(response.data, response.metadata);
    return {
      ...paginated,
      data: paginated.data.map(transformProduct),
    };
  },

  /**
   * Get product by ID.
   */
  async getProduct(id: number): Promise<ProductSearchResult> {
    const product = await httpClient.get<ProductSearchResult>(PRODUCT_ENDPOINTS.byId(id));
    return transformProduct(product);
  },
};
