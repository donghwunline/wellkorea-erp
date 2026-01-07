/**
 * Auth API functions.
 *
 * Raw HTTP calls without business logic.
 */

import { httpClient, AUTH_ENDPOINTS } from '@/shared/api';
import type { User } from '@/shared/domain';
import type { LoginRequestDTO, LoginResponseDTO } from './auth.dto';
import type { LoginResult } from './auth.mapper';
import { authMapper } from './auth.mapper';

/**
 * Auth API functions.
 */
export const authApi = {
  /**
   * Authenticate user with credentials.
   */
  async login(credentials: LoginRequestDTO): Promise<LoginResult> {
    const response = await httpClient.post<LoginResponseDTO>(
      AUTH_ENDPOINTS.LOGIN,
      credentials
    );
    return authMapper.toLoginResult(response);
  },

  /**
   * Logout current user.
   * Best-effort call - may fail if network is unavailable.
   */
  async logout(): Promise<void> {
    await httpClient.post<void>(AUTH_ENDPOINTS.LOGOUT);
  },

  /**
   * Get current authenticated user.
   */
  async getCurrentUser(): Promise<User> {
    const response = await httpClient.get<User>(AUTH_ENDPOINTS.ME);
    return {
      ...response,
      email: response.email.toLowerCase().trim(),
      fullName: response.fullName.trim(),
    };
  },
};
