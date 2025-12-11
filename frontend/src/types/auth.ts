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

/**
 * Extended user info from admin API (includes more details).
 */
export interface UserDetails {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: RoleName[];
  createdAt: string;
  lastLoginAt: string | null;
}

export type RoleName = 'ROLE_ADMIN' | 'ROLE_FINANCE' | 'ROLE_PRODUCTION' | 'ROLE_SALES';

export const ROLE_LABELS: Record<RoleName, string> = {
  ROLE_ADMIN: 'Administrator',
  ROLE_FINANCE: 'Finance',
  ROLE_PRODUCTION: 'Production',
  ROLE_SALES: 'Sales',
};

export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  ROLE_ADMIN: 'Full system access',
  ROLE_FINANCE: 'Quotations, invoices, AR/AP reports',
  ROLE_PRODUCTION: 'Work progress, production tracking',
  ROLE_SALES: 'Quotations for assigned customers',
};

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

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: RoleName[];
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
}

export interface AssignRolesRequest {
  roles: RoleName[];
}

export interface ChangePasswordRequest {
  newPassword: string;
}
