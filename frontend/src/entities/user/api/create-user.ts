/**
 * Create User command function.
 *
 * Encapsulates validation, mapping, and API call in one module.
 * Follows FSD pattern: entities/{entity}/api/create-{entity}.ts
 */

import { httpClient, USER_ENDPOINTS } from '@/shared/api';
import type { RoleName } from '../model/role';
import type { UserDetailsResponse } from './user.mapper';

// =============================================================================
// REQUEST TYPE
// =============================================================================

/**
 * Request type for creating a new user.
 */
interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: RoleName[];
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Create user input from UI forms.
 */
export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: RoleName[];
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map create input to API request.
 */
function toCreateRequest(input: CreateUserInput): CreateUserRequest {
  return {
    username: input.username.trim().toLowerCase(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    fullName: input.fullName.trim(),
    roles: input.roles,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Create a new user.
 *
 * Maps input and calls API.
 *
 * @param input - UI form input
 * @returns Created user details
 *
 * @example
 * ```typescript
 * const user = await createUser({
 *   username: 'john.doe',
 *   email: 'john@example.com',
 *   password: 'password123',
 *   fullName: 'John Doe',
 *   roles: ['ROLE_USER'],
 * });
 * ```
 */
export async function createUser(input: CreateUserInput): Promise<UserDetailsResponse> {
  const request = toCreateRequest(input);
  return httpClient.post<UserDetailsResponse>(USER_ENDPOINTS.BASE, request);
}
