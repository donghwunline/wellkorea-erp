/**
 * Auth service types.
 *
 * API DTOs are defined here. Shared domain types are re-exported from @/shared/types.
 */

import type { User } from '@/shared/types/auth';

// Re-export shared domain types for convenience
export type { RoleName, User, UserDetails } from '@/shared/types/auth';

// API DTOs (service-specific)
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}
