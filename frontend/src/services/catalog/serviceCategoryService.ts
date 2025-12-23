/**
 * Service category management service.
 * Business logic layer for service category and vendor offering operations.
 *
 * Features:
 * - Service category CRUD operations
 * - Vendor offering CRUD operations
 * - CQRS pattern: commands return IDs, queries return full data
 */

import { httpClient, SERVICE_CATEGORY_ENDPOINTS } from '@/api';
import type { PagedResponse } from '@/api/types';
import { transformPagedResponse } from '@/services/shared';
import type {
  CreateServiceCategoryRequest,
  CreateVendorOfferingRequest,
  PaginatedServiceCategories,
  PaginatedVendorOfferings,
  ServiceCategoryCommandResult,
  ServiceCategoryDetails,
  ServiceCategoryListParams,
  ServiceCategorySummary,
  UpdateServiceCategoryRequest,
  UpdateVendorOfferingRequest,
  VendorOfferingCommandResult,
  VendorOfferingListParams,
  VendorServiceOffering,
} from './types';

/**
 * Service category management service.
 */
export const serviceCategoryService = {
  // ========== SERVICE CATEGORY QUERY OPERATIONS ==========

  /**
   * Get paginated list of service categories.
   *
   * @param params List parameters (page, size, search)
   * @returns Paginated service categories
   */
  async getServiceCategories(params?: ServiceCategoryListParams): Promise<PaginatedServiceCategories> {
    const response = await httpClient.requestWithMeta<PagedResponse<ServiceCategorySummary>>({
      method: 'GET',
      url: SERVICE_CATEGORY_ENDPOINTS.BASE,
      params,
    });

    return transformPagedResponse(response.data, response.metadata);
  },

  /**
   * Get all service categories (for dropdown).
   *
   * @returns List of all active service categories
   */
  async getAllServiceCategories(): Promise<ServiceCategorySummary[]> {
    return httpClient.get<ServiceCategorySummary[]>(SERVICE_CATEGORY_ENDPOINTS.all);
  },

  /**
   * Get service category details by ID.
   *
   * @param id Service category ID
   * @returns Service category details
   */
  async getServiceCategory(id: number): Promise<ServiceCategoryDetails> {
    return httpClient.get<ServiceCategoryDetails>(SERVICE_CATEGORY_ENDPOINTS.byId(id));
  },

  // ========== SERVICE CATEGORY COMMAND OPERATIONS ==========

  /**
   * Create a new service category.
   *
   * @param request Creation request
   * @returns Command result with created ID
   */
  async createServiceCategory(request: CreateServiceCategoryRequest): Promise<ServiceCategoryCommandResult> {
    return httpClient.post<ServiceCategoryCommandResult>(SERVICE_CATEGORY_ENDPOINTS.BASE, request);
  },

  /**
   * Update a service category.
   *
   * @param id Service category ID
   * @param request Update request
   * @returns Command result with updated ID
   */
  async updateServiceCategory(
    id: number,
    request: UpdateServiceCategoryRequest
  ): Promise<ServiceCategoryCommandResult> {
    return httpClient.put<ServiceCategoryCommandResult>(SERVICE_CATEGORY_ENDPOINTS.byId(id), request);
  },

  /**
   * Delete (deactivate) a service category.
   *
   * @param id Service category ID
   */
  async deleteServiceCategory(id: number): Promise<void> {
    await httpClient.delete<void>(SERVICE_CATEGORY_ENDPOINTS.byId(id));
  },

  // ========== VENDOR OFFERING QUERY OPERATIONS ==========

  /**
   * Get vendor offerings for a service category.
   *
   * @param serviceCategoryId Service category ID
   * @param params Pagination parameters
   * @returns Paginated vendor offerings
   */
  async getOfferingsForCategory(
    serviceCategoryId: number,
    params?: VendorOfferingListParams
  ): Promise<PaginatedVendorOfferings> {
    const response = await httpClient.requestWithMeta<PagedResponse<VendorServiceOffering>>({
      method: 'GET',
      url: SERVICE_CATEGORY_ENDPOINTS.offerings(serviceCategoryId),
      params,
    });

    return transformPagedResponse(response.data, response.metadata);
  },

  /**
   * Get current vendor offerings for a service category.
   * Only includes offerings within their effective date range.
   *
   * @param serviceCategoryId Service category ID
   * @returns List of current vendor offerings
   */
  async getCurrentOfferingsForCategory(serviceCategoryId: number): Promise<VendorServiceOffering[]> {
    return httpClient.get<VendorServiceOffering[]>(
      SERVICE_CATEGORY_ENDPOINTS.currentOfferings(serviceCategoryId)
    );
  },

  /**
   * Get vendor offering by ID.
   *
   * @param offeringId Offering ID
   * @returns Vendor offering details
   */
  async getVendorOffering(offeringId: number): Promise<VendorServiceOffering> {
    return httpClient.get<VendorServiceOffering>(SERVICE_CATEGORY_ENDPOINTS.offering(offeringId));
  },

  // ========== VENDOR OFFERING COMMAND OPERATIONS ==========

  /**
   * Create a new vendor offering.
   *
   * @param request Creation request
   * @returns Command result with created ID
   */
  async createVendorOffering(request: CreateVendorOfferingRequest): Promise<VendorOfferingCommandResult> {
    return httpClient.post<VendorOfferingCommandResult>(
      SERVICE_CATEGORY_ENDPOINTS.createOffering,
      request
    );
  },

  /**
   * Update a vendor offering.
   *
   * @param offeringId Offering ID
   * @param request Update request
   * @returns Command result with updated ID
   */
  async updateVendorOffering(
    offeringId: number,
    request: UpdateVendorOfferingRequest
  ): Promise<VendorOfferingCommandResult> {
    return httpClient.put<VendorOfferingCommandResult>(
      SERVICE_CATEGORY_ENDPOINTS.offering(offeringId),
      request
    );
  },

  /**
   * Delete a vendor offering.
   *
   * @param offeringId Offering ID
   */
  async deleteVendorOffering(offeringId: number): Promise<void> {
    await httpClient.delete<void>(SERVICE_CATEGORY_ENDPOINTS.offering(offeringId));
  },
};
