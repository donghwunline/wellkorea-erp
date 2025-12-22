/**
 * Customer service types.
 */

import type { Paginated } from '@/api/types';

/**
 * Customer details from API.
 */
export interface CustomerDetails {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Parameters for listing customers.
 */
export interface CustomerListParams {
  page?: number;
  size?: number;
  search?: string;
}

/**
 * Paginated customer response.
 */
export type PaginatedCustomers = Paginated<CustomerDetails>;
