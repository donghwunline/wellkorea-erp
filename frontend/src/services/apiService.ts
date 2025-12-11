/**
 * Generic API service wrapper that automatically unwraps ApiResponse<T>.
 * Provides type-safe methods for common HTTP operations.
 *
 * This service handles the unwrapping of backend's ApiResponse<T> structure,
 * so consumers can work directly with the data payload.
 *
 * Usage:
 * ```typescript
 * // Simple GET - returns data directly
 * const project = await apiService.get<Project>('/projects/123');
 *
 * // Paginated GET - returns data and metadata separately
 * const { data: projects, metadata } = await apiService.getWithMeta<Project[]>('/projects', {
 *   params: { page: 0, size: 20 }
 * });
 *
 * // POST with automatic unwrap
 * const newProject = await apiService.post<Project>('/projects', projectData);
 * ```
 */

import api from './api';
import type {AxiosRequestConfig, AxiosResponse} from 'axios';
import type {ApiResponse, PaginationMetadata} from '@/types/api';
import {hasPaginationMetadata} from '@/types/api';

/**
 * Result type when accessing both data and metadata from response.
 */
export interface ApiResponseWithMeta<T> {
  data: T;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class ApiService {
  /**
   * Private helper to transform AxiosResponse to ApiResponseWithMeta.
   * Extracts data, message, timestamp, and metadata from the wrapped response.
   *
   * @param response Axios response containing ApiResponse<T>
   * @returns Transformed response with metadata
   */
  private transformToApiResponseWithMeta<T>(
    response: AxiosResponse<ApiResponse<T>>
  ): ApiResponseWithMeta<T> {
    return {
      data: response.data.data,
      message: response.data.message,
      timestamp: response.data.timestamp,
      metadata: response.data.metadata,
    };
  }

  /**
   * Perform GET request and return unwrapped data.
   *
   * @param url Request URL
   * @param config Optional Axios config (params, headers, etc.)
   * @returns Unwrapped data payload
   * @throws AxiosError with enhanced error information
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  /**
   * Perform POST request and return unwrapped data.
   *
   * @param url Request URL
   * @param data Request body
   * @param config Optional Axios config
   * @returns Unwrapped data payload
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await api.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  /**
   * Perform PUT request and return unwrapped data.
   *
   * @param url Request URL
   * @param data Request body
   * @param config Optional Axios config
   * @returns Unwrapped data payload
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await api.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  /**
   * Perform PATCH request and return unwrapped data.
   *
   * @param url Request URL
   * @param data Request body
   * @param config Optional Axios config
   * @returns Unwrapped data payload
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await api.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  /**
   * Perform DELETE request and return unwrapped data.
   *
   * @param url Request URL
   * @param config Optional Axios config
   * @returns Unwrapped data payload (often void or confirmation message)
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  /**
   * Perform GET request and return full ApiResponse (data + metadata + message).
   * Useful when you need access to metadata (pagination) or success message.
   *
   * @param url Request URL
   * @param config Optional Axios config
   * @returns Full ApiResponse with data, message, timestamp, and metadata
   * @example
   * const response = await apiService.getWithMeta<Project[]>('/projects');
   * console.log(response.message); // "Projects retrieved successfully"
   * console.log(response.metadata); // { page: 0, size: 20, totalElements: 150 }
   * const projects = response.data; // Project[]
   */
  async getWithMeta<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponseWithMeta<T>> {
    const response = await api.get<ApiResponse<T>>(url, config);
    return this.transformToApiResponseWithMeta(response);
  }

  /**
   * Perform POST request and return full ApiResponse.
   *
   * @param url Request URL
   * @param data Request body
   * @param config Optional Axios config
   * @returns Full ApiResponse with data, message, timestamp, and metadata
   */
  async postWithMeta<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponseWithMeta<T>> {
    const response = await api.post<ApiResponse<T>>(url, data, config);
    return this.transformToApiResponseWithMeta(response);
  }

  /**
   * Specialized method for paginated GET requests.
   * Returns data and typed pagination metadata separately.
   *
   * @param url Request URL
   * @param config Optional Axios config (include pagination params here)
   * @returns Object with data array and pagination metadata
   * @example
   * const { data: projects, pagination } = await apiService.getPaginated<Project>(
   *   '/projects',
   *   { params: { page: 0, size: 20 } }
   * );
   * console.log(pagination.totalElements); // 150
   * console.log(pagination.totalPages); // 8
   */
  async getPaginated<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<{data: T[]; pagination: PaginationMetadata}> {
    const response = await api.get<ApiResponse<T[]>>(url, config);

    if (!hasPaginationMetadata(response.data)) {
      throw new Error(
        'Response does not contain valid pagination metadata. Use get() instead.'
      );
    }

    return {
      data: response.data.data,
      pagination: response.data.metadata,
    };
  }
}

/**
 * Singleton instance of ApiService.
 * Use this for all API calls to get automatic response unwrapping.
 */
export const apiService = new ApiService();

/**
 * Default export for convenience.
 */
export default apiService;
