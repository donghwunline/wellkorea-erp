/**
 * Assign Customers command function.
 *
 * Assigns customer accounts to a sales representative.
 */

import { httpClient, USER_ENDPOINTS } from '@/shared/api';
import type { AssignCustomersRequestDTO } from './user.dto';

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Assign customers input from UI forms.
 */
export interface AssignCustomersInput {
  customerIds: number[];
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map input to API request.
 */
function toAssignCustomersRequest(input: AssignCustomersInput): AssignCustomersRequestDTO {
  return {
    customerIds: input.customerIds,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Assign customers to a user.
 *
 * @param id - User ID
 * @param input - Customer IDs to assign
 *
 * @example
 * ```typescript
 * await assignCustomers(123, { customerIds: [1, 2, 3] });
 * ```
 */
export async function assignCustomers(id: number, input: AssignCustomersInput): Promise<void> {
  const request = toAssignCustomersRequest(input);
  await httpClient.put<void>(USER_ENDPOINTS.customers(id), request);
}

/**
 * Get customer assignments for a user.
 *
 * @param id - User ID
 * @returns Array of assigned customer IDs
 */
export async function getCustomerAssignments(id: number): Promise<number[]> {
  const response = await httpClient.get<{ customerIds: number[] }>(USER_ENDPOINTS.customers(id));
  return response.customerIds;
}
