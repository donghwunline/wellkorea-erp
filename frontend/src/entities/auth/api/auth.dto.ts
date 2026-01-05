/**
 * Auth API DTOs.
 *
 * Data Transfer Objects for auth API endpoints.
 */

import type { RoleName } from '@/entities/user';

// ==================== REQUEST DTOs ====================

/**
 * Login request DTO.
 */
export interface LoginRequestDTO {
  username: string;
  password: string;
}

// ==================== RESPONSE DTOs ====================

/**
 * User data in login response.
 */
export interface LoginUserDTO {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: RoleName[];
}

/**
 * Login response DTO.
 */
export interface LoginResponseDTO {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  user: LoginUserDTO;
}
