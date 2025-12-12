/**
 * Authentication API service.
 * Encapsulates all auth-related API endpoints.
 */

import api from './api';
import apiService from './apiService';
import type {LoginRequest, LoginResponse, User} from '@/types/auth';

const BASE_PATH = '/auth';

/**
 * Authentication API endpoints.
 */
export const authApi = {
  /**
   * Authenticate user with credentials.
   * @param credentials - Username and password
   * @returns Login response with tokens and user info
   */
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    apiService.post<LoginResponse>(`${BASE_PATH}/login`, credentials),

  /**
   * Logout current user and invalidate token.
   * Uses raw api to avoid response unwrapping (logout returns empty response).
   */
  logout: (): Promise<void> =>
    api.post(`${BASE_PATH}/logout`).then(() => undefined),

  /**
   * Refresh the current access token.
   * @returns New login response with fresh tokens
   */
  refreshToken: (): Promise<LoginResponse> =>
    apiService.post<LoginResponse>(`${BASE_PATH}/refresh`),

  /**
   * Get current authenticated user info.
   * @returns Current user details
   */
  getCurrentUser: (): Promise<User> =>
    apiService.get<User>(`${BASE_PATH}/me`),
};

export default authApi;
