/**
 * Product management service.
 * Business logic layer for product operations.
 *
 * Features:
 * - Product CRUD operations
 * - Product type retrieval
 * - CQRS pattern: commands return IDs, queries return full data
 */

import { httpClient, PRODUCT_ENDPOINTS } from '@/api';
import type { PagedResponse } from '@/api/types';
import { transformPagedResponse } from '@/services/shared';
import type {
  CreateProductRequest,
  PaginatedProducts,
  ProductCommandResult,
  ProductDetails,
  ProductListParams,
  ProductSearchParams,
  ProductSummary,
  ProductType,
  UpdateProductRequest,
} from './types';

/**
 * Product management service.
 */
export const productService = {
  // ========== QUERY OPERATIONS ==========

  /**
   * Get paginated list of products.
   * Supports filtering by product type and search.
   *
   * @param params List parameters (page, size, productTypeId, search)
   * @returns Paginated products
   */
  async getProducts(params?: ProductListParams): Promise<PaginatedProducts> {
    const response = await httpClient.requestWithMeta<PagedResponse<ProductSummary>>({
      method: 'GET',
      url: PRODUCT_ENDPOINTS.BASE,
      params,
    });

    return transformPagedResponse(response.data, response.metadata);
  },

  /**
   * Get product details by ID.
   *
   * @param id Product ID
   * @returns Product details
   */
  async getProduct(id: number): Promise<ProductDetails> {
    return httpClient.get<ProductDetails>(PRODUCT_ENDPOINTS.byId(id));
  },

  /**
   * Get all product types.
   *
   * @returns List of product types
   */
  async getProductTypes(): Promise<ProductType[]> {
    return httpClient.get<ProductType[]>(PRODUCT_ENDPOINTS.types);
  },

  /**
   * Search products (for combobox/autocomplete).
   * Uses the same endpoint as getProducts but with query param.
   *
   * @param params Search parameters with query string
   * @returns Paginated product results
   */
  async searchProducts(params: ProductSearchParams): Promise<PaginatedProducts> {
    const response = await httpClient.requestWithMeta<PagedResponse<ProductSummary>>({
      method: 'GET',
      url: PRODUCT_ENDPOINTS.BASE,
      params: {
        search: params.query,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });

    return transformPagedResponse(response.data, response.metadata);
  },

  // ========== COMMAND OPERATIONS ==========

  /**
   * Create a new product.
   * CQRS: Returns only ID, fetch fresh data via getProduct if needed.
   *
   * @param request Product creation request
   * @returns Command result with created product ID
   */
  async createProduct(request: CreateProductRequest): Promise<ProductCommandResult> {
    return httpClient.post<ProductCommandResult>(PRODUCT_ENDPOINTS.BASE, request);
  },

  /**
   * Update an existing product.
   * CQRS: Returns only ID, fetch fresh data via getProduct if needed.
   *
   * @param id Product ID
   * @param request Update request
   * @returns Command result with updated product ID
   */
  async updateProduct(id: number, request: UpdateProductRequest): Promise<ProductCommandResult> {
    return httpClient.put<ProductCommandResult>(PRODUCT_ENDPOINTS.byId(id), request);
  },

  /**
   * Delete (deactivate) a product.
   *
   * @param id Product ID
   */
  async deleteProduct(id: number): Promise<void> {
    await httpClient.delete<void>(PRODUCT_ENDPOINTS.byId(id));
  },
};
