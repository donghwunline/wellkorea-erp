/**
 * Customer service.
 * Business logic layer for customer operations.
 *
 * NOTE: This is a STUB service using mock data.
 * Replace with real API calls when backend endpoint is available.
 *
 * Expected backend endpoint: GET /api/customers
 */

import type { CustomerDetails, CustomerListParams, PaginatedCustomers } from './types';

/**
 * Mock customer data.
 * TODO: Remove when backend /api/customers endpoint is available.
 */
const MOCK_CUSTOMERS: CustomerDetails[] = [
  { id: 1, name: 'Samsung Electronics', email: 'contact@samsung.com', phone: '02-1234-5678', address: 'Seoul, Korea', isActive: true, createdAt: '2024-01-01' },
  { id: 2, name: 'LG Display', email: 'info@lgdisplay.com', phone: '02-2345-6789', address: 'Seoul, Korea', isActive: true, createdAt: '2024-01-02' },
  { id: 3, name: 'SK Hynix', email: 'contact@skhynix.com', phone: '031-345-6789', address: 'Icheon, Korea', isActive: true, createdAt: '2024-01-03' },
  { id: 4, name: 'Hyundai Motor', email: 'info@hyundai.com', phone: '02-3456-7890', address: 'Seoul, Korea', isActive: true, createdAt: '2024-01-04' },
  { id: 5, name: 'POSCO', email: 'contact@posco.com', phone: '054-456-7890', address: 'Pohang, Korea', isActive: true, createdAt: '2024-01-05' },
  { id: 6, name: 'Kia Corporation', email: 'info@kia.com', phone: '02-4567-8901', address: 'Seoul, Korea', isActive: true, createdAt: '2024-01-06' },
  { id: 7, name: 'Naver Corporation', email: 'contact@naver.com', phone: '031-567-8901', address: 'Seongnam, Korea', isActive: true, createdAt: '2024-01-07' },
  { id: 8, name: 'Kakao', email: 'info@kakao.com', phone: '064-678-9012', address: 'Jeju, Korea', isActive: true, createdAt: '2024-01-08' },
];

/**
 * Simulate API delay for realistic UX testing.
 */
function simulateDelay(ms: number = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Customer service with mock data.
 *
 * When backend is ready, replace implementation with:
 * ```typescript
 * async getCustomers(params?: CustomerListParams): Promise<PaginatedCustomers> {
 *   const response = await httpClient.requestWithMeta<PagedResponse<CustomerDetails>>({
 *     method: 'GET',
 *     url: CUSTOMER_ENDPOINTS.BASE,
 *     params,
 *   });
 *   return transformPagedResponse(response.data, response.metadata);
 * }
 * ```
 */
export const customerService = {
  /**
   * Get paginated list of customers.
   * Currently returns mock data.
   */
  async getCustomers(params?: CustomerListParams): Promise<PaginatedCustomers> {
    await simulateDelay();

    const { page = 0, size = 20, search } = params ?? {};

    // Filter by search query
    let filtered = MOCK_CUSTOMERS;
    if (search?.trim()) {
      const query = search.toLowerCase();
      filtered = MOCK_CUSTOMERS.filter(
        c => c.name.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query)
      );
    }

    // Paginate
    const start = page * size;
    const end = start + size;
    const data = filtered.slice(start, end);

    return {
      data,
      pagination: {
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
        first: page === 0,
        last: end >= filtered.length,
      },
    };
  },

  /**
   * Get customer by ID.
   * Currently returns mock data.
   */
  async getCustomer(id: number): Promise<CustomerDetails> {
    await simulateDelay();

    const customer = MOCK_CUSTOMERS.find(c => c.id === id);
    if (!customer) {
      throw new Error(`Customer not found with ID: ${id}`);
    }
    return customer;
  },
};
