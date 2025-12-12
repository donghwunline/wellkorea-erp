/**
 * Auth service types (domain models).
 * These are the types used by the application (after DTO transformation).
 */

export type { LoginRequest, RoleName, User, UserDetails } from '@/types/auth';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string | null;
  user: User;
}

// Re-export from existing types for now
import type { User } from '@/types/auth';
