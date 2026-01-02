/**
 * Search Products API Function.
 *
 * Direct API call for product search, intended for async callbacks
 * (e.g., Combobox loadOptions) where React Query hooks cannot be used.
 *
 * Returns domain models (ProductListItem[]) directly.
 *
 * @example
 * ```typescript
 * // In a Combobox loadOptions callback
 * const loadProducts = async (query: string) => {
 *   const { products } = await searchProductsApi(query);
 *   return products.map(p => ({ id: p.id, label: p.name }));
 * };
 * ```
 *
 * TODO: Consider refactoring components to use a pattern that works with
 * React Query (e.g., controlled input + debounce + useQuery) for better
 * caching and deduplication.
 */

import type { ProductListItem } from '../model/product';
import { productMapper } from './product.mapper';
import { searchProducts } from './get-product';

/**
 * Result of product search.
 */
export interface SearchProductsResult {
  products: ProductListItem[];
  total: number;
}

/**
 * Search products directly via API.
 *
 * Bypasses React Query for use in async callbacks where hooks can't be used.
 * Returns domain models mapped from API response.
 *
 * @param query - Search term (name or SKU)
 * @param limit - Maximum results to return (default: 20)
 */
export async function searchProductsApi(
  query: string,
  limit: number = 20
): Promise<SearchProductsResult> {
  if (!query.trim()) {
    return { products: [], total: 0 };
  }

  const response = await searchProducts(query, { size: limit });

  return {
    products: response.data.map(productMapper.toListItem),
    total: response.pagination.totalElements,
  };
}
