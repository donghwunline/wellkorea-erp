/**
 * Product API Functions.
 *
 * Internal raw API calls for products.
 * Used by query factory and command functions.
 */

import { httpClient, PRODUCT_ENDPOINTS } from '@/shared/api';
import type { PagedResponse, PaginationMetadata } from '@/shared/api/types';
import type {
  ProductDetailResponse,
  ProductSummaryResponse,
  ProductTypeResponse,
} from './product.dto';

// =============================================================================
// API RESPONSE TYPE
// =============================================================================

/**
 * Paginated response with metadata.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// =============================================================================
// API PARAMS
// =============================================================================

/**
 * Parameters for listing products.
 */
export interface GetProductsParams {
  page?: number;
  size?: number;
  productTypeId?: number;
  search?: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get paginated list of products.
 */
export async function getProducts(
  params: GetProductsParams = {}
): Promise<PaginatedResponse<ProductSummaryResponse>> {
  const response = await httpClient.requestWithMeta<PagedResponse<ProductSummaryResponse>>({
    method: 'GET',
    url: PRODUCT_ENDPOINTS.BASE,
    params: {
      page: params.page,
      size: params.size,
      productTypeId: params.productTypeId,
      search: params.search,
    },
  });

  return {
    data: response.data.content,
    pagination: response.metadata as unknown as PaginationMetadata,
  };
}

/**
 * Get product by ID.
 */
export async function getProduct(id: number): Promise<ProductDetailResponse> {
  return httpClient.get<ProductDetailResponse>(PRODUCT_ENDPOINTS.byId(id));
}

/**
 * Get all product types.
 */
export async function getProductTypes(): Promise<ProductTypeResponse[]> {
  return httpClient.get<ProductTypeResponse[]>(PRODUCT_ENDPOINTS.types);
}

/**
 * Search products (for combobox/autocomplete).
 */
export async function searchProducts(
  query: string,
  options: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<ProductSummaryResponse>> {
  return getProducts({
    search: query,
    page: options.page ?? 0,
    size: options.size ?? 20,
  });
}
