/**
 * Delivery Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { deliveryQueries } from './delivery.queries';
import { expectValidQueryOptions, expectQueryKey, invokeQueryFn } from '@/test/entity-test-utils';
import type { DeliverySummaryResponse, DeliveryDetailResponse } from './delivery.mapper';

// Mock dependencies
vi.mock('./get-delivery', () => ({
  getDeliveries: vi.fn(),
  getDeliveryById: vi.fn(),
}));

vi.mock('./delivery.mapper', () => ({
  deliveryMapper: {
    summaryToDomain: vi.fn((response) => ({
      id: response.id,
      projectId: response.projectId,
      deliveryDate: response.deliveryDate,
      status: response.status,
      deliveredByName: response.deliveredByName,
      lineItems: response.lineItems,
      _mapped: true,
    })),
    toDomain: vi.fn((response) => ({
      id: response.id,
      projectId: response.projectId,
      jobCode: response.jobCode,
      deliveryDate: response.deliveryDate,
      status: response.status,
      deliveredById: response.deliveredById,
      deliveredByName: response.deliveredByName,
      notes: response.notes,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      lineItems: response.lineItems,
      _mapped: true,
    })),
  },
}));

// Import mocked modules
import { getDeliveries, getDeliveryById } from './get-delivery';
import { deliveryMapper } from './delivery.mapper';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockDeliverySummaryResponse(
  overrides: Partial<DeliverySummaryResponse> = {}
): DeliverySummaryResponse {
  return {
    id: 1,
    projectId: 100,
    quotationId: 10,
    deliveryDate: '2025-01-07',
    status: 'PENDING',
    deliveredByName: 'John Doe',
    lineItemCount: 2,
    totalQuantityDelivered: 50,
    createdAt: '2025-01-07T10:00:00Z',
    lineItems: [
      {
        id: 1,
        productId: 1,
        productName: 'Product A',
        productSku: 'SKU-001',
        quantityDelivered: 30,
      },
      {
        id: 2,
        productId: 2,
        productName: 'Product B',
        productSku: null,
        quantityDelivered: 20,
      },
    ],
    ...overrides,
  };
}

function createMockDeliveryDetailResponse(
  overrides: Partial<DeliveryDetailResponse> = {}
): DeliveryDetailResponse {
  return {
    id: 1,
    projectId: 100,
    quotationId: 10,
    jobCode: 'WK2025-001',
    deliveryDate: '2025-01-07',
    status: 'PENDING',
    deliveredById: 5,
    deliveredByName: 'John Doe',
    notes: 'Test delivery notes',
    createdAt: '2025-01-07T10:00:00Z',
    updatedAt: '2025-01-07T10:00:00Z',
    lineItems: [
      {
        id: 1,
        productId: 1,
        productName: 'Product A',
        productSku: 'SKU-001',
        quantityDelivered: 30,
      },
    ],
    ...overrides,
  };
}

describe('deliveryQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(deliveryQueries.all(), ['deliveries']);
      });
    });

    describe('lists()', () => {
      it('should return list query key segment', () => {
        expectQueryKey(deliveryQueries.lists(), ['deliveries', 'list']);
      });
    });

    describe('details()', () => {
      it('should return detail query key segment', () => {
        expectQueryKey(deliveryQueries.details(), ['deliveries', 'detail']);
      });
    });
  });

  // ==========================================================================
  // List Query Tests
  // ==========================================================================

  describe('list()', () => {
    it('should return valid queryOptions', () => {
      const options = deliveryQueries.list({ projectId: 100 });
      expectValidQueryOptions(options);
    });

    it('should include all params in query key', () => {
      const options = deliveryQueries.list({
        projectId: 100,
        status: 'PENDING',
        page: 0,
        size: 20,
      });
      expect(options.queryKey).toEqual(['deliveries', 'list', 100, 'PENDING', 0, 20]);
    });

    it('should include undefined for missing params in query key', () => {
      const options = deliveryQueries.list({ projectId: 100 });
      expect(options.queryKey).toEqual(['deliveries', 'list', 100, undefined, undefined, undefined]);
    });

    it('should call getDeliveries with correct params in queryFn', async () => {
      const mockResponse = [createMockDeliverySummaryResponse()];
      vi.mocked(getDeliveries).mockResolvedValue(mockResponse);

      const params = { projectId: 100, status: 'PENDING' as const };
      const options = deliveryQueries.list(params);
      await invokeQueryFn(options);

      expect(getDeliveries).toHaveBeenCalledWith(params);
    });

    it('should map each response using deliveryMapper.summaryToDomain', async () => {
      const mockResponse = [
        createMockDeliverySummaryResponse({ id: 1 }),
        createMockDeliverySummaryResponse({ id: 2 }),
      ];
      vi.mocked(getDeliveries).mockResolvedValue(mockResponse);

      const options = deliveryQueries.list({ projectId: 100 });
      const result = await invokeQueryFn<Array<{ _mapped: boolean }>>(options);

      expect(deliveryMapper.summaryToDomain).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('_mapped', true);
      expect(result[1]).toHaveProperty('_mapped', true);
    });

    it('should generate different query keys for different projectIds', () => {
      const key1 = deliveryQueries.list({ projectId: 1 }).queryKey;
      const key2 = deliveryQueries.list({ projectId: 2 }).queryKey;

      expect(key1).not.toEqual(key2);
      expect(key1[2]).toBe(1);
      expect(key2[2]).toBe(2);
    });

    it('should generate stable query keys for same params', () => {
      const params = { projectId: 100, status: 'PENDING' as const };
      const key1 = deliveryQueries.list(params).queryKey;
      const key2 = deliveryQueries.list(params).queryKey;

      expect(key1).toEqual(key2);
    });

    it('should have placeholderData configured', () => {
      const options = deliveryQueries.list({ projectId: 100 });
      expect(options.placeholderData).toBeDefined();
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = deliveryQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = deliveryQueries.detail(123);
      expect(options.queryKey).toEqual(['deliveries', 'detail', 123]);
    });

    it('should have enabled = false when id <= 0', () => {
      const optionsZero = deliveryQueries.detail(0);
      const optionsNegative = deliveryQueries.detail(-1);

      expect(optionsZero.enabled).toBe(false);
      expect(optionsNegative.enabled).toBe(false);
    });

    it('should have enabled = true when id > 0', () => {
      const options = deliveryQueries.detail(1);
      expect(options.enabled).toBe(true);
    });

    it('should call getDeliveryById with correct id in queryFn', async () => {
      const mockResponse = createMockDeliveryDetailResponse({ id: 123 });
      vi.mocked(getDeliveryById).mockResolvedValue(mockResponse);

      const options = deliveryQueries.detail(123);
      await invokeQueryFn(options);

      expect(getDeliveryById).toHaveBeenCalledWith(123);
    });

    it('should map response using deliveryMapper.toDomain', async () => {
      const mockResponse = createMockDeliveryDetailResponse({ id: 123 });
      vi.mocked(getDeliveryById).mockResolvedValue(mockResponse);

      const options = deliveryQueries.detail(123);
      const result = await invokeQueryFn<{ _mapped: boolean }>(options);

      expect(deliveryMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toHaveProperty('_mapped', true);
    });

    it('should generate different query keys for different ids', () => {
      const key1 = deliveryQueries.detail(1).queryKey;
      const key2 = deliveryQueries.detail(2).queryKey;

      expect(key1).not.toEqual(key2);
      expect(key1[2]).toBe(1);
      expect(key2[2]).toBe(2);
    });
  });

  // ==========================================================================
  // Edge Case Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty deliveries array in list response', async () => {
      vi.mocked(getDeliveries).mockResolvedValue([]);

      const options = deliveryQueries.list({ projectId: 100 });
      const result = await invokeQueryFn<unknown[]>(options);

      expect(result).toEqual([]);
      expect(deliveryMapper.summaryToDomain).not.toHaveBeenCalled();
    });

    it('should handle empty lineItems in detail response', async () => {
      const mockResponse = createMockDeliveryDetailResponse({
        id: 1,
        lineItems: [],
      });
      vi.mocked(getDeliveryById).mockResolvedValue(mockResponse);

      const options = deliveryQueries.detail(1);
      await invokeQueryFn(options);

      expect(deliveryMapper.toDomain).toHaveBeenCalledWith(
        expect.objectContaining({ lineItems: [] })
      );
    });

    it('should handle null notes in detail response', async () => {
      const mockResponse = createMockDeliveryDetailResponse({
        id: 1,
        notes: null,
      });
      vi.mocked(getDeliveryById).mockResolvedValue(mockResponse);

      const options = deliveryQueries.detail(1);
      await invokeQueryFn(options);

      expect(deliveryMapper.toDomain).toHaveBeenCalledWith(
        expect.objectContaining({ notes: null })
      );
    });

    it('should handle list query with no params', async () => {
      vi.mocked(getDeliveries).mockResolvedValue([]);

      const options = deliveryQueries.list();
      expect(options.queryKey).toEqual([
        'deliveries',
        'list',
        undefined,
        undefined,
        undefined,
        undefined,
      ]);

      await invokeQueryFn(options);
      expect(getDeliveries).toHaveBeenCalledWith({});
    });
  });
});
