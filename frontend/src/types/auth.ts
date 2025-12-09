/**
 * Authentication and user types for the application.
 */

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: RoleName[];
}

export type RoleName = 'ADMIN' | 'FINANCE' | 'PRODUCTION' | 'SALES';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
