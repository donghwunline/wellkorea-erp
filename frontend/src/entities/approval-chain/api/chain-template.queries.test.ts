/**
 * Chain Template Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { chainTemplateQueries } from './chain-template.queries';
import { expectValidQueryOptions, expectQueryKey, invokeQueryFn } from '@/test/entity-test-utils';

// Mock dependencies
vi.mock('./get-chain-template', () => ({
  getChainTemplate: vi.fn(),
  getChainTemplates: vi.fn(),
}));

vi.mock('./chain-template.mapper', () => ({
  chainTemplateMapper: {
    toTemplate: vi.fn((response) => ({ ...response, _mapped: true })),
  },
}));

// Import mocked modules
import { getChainTemplate, getChainTemplates } from './get-chain-template';
import { chainTemplateMapper } from './chain-template.mapper';
import type { ChainTemplateResponse } from './chain-template.mapper';

// =============================================================================
// Test Fixtures - Minimal Response objects to satisfy TypeScript
// =============================================================================

function createMockChainTemplateResponse(
  overrides: Partial<ChainTemplateResponse> = {}
): ChainTemplateResponse {
  return {
    id: 1,
    entityType: 'QUOTATION',
    name: '',
    description: null,
    isActive: true,
    levels: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('chainTemplateQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(chainTemplateQueries.all(), ['chain-templates']);
      });
    });

    describe('lists()', () => {
      it('should return list query key with "list" segment', () => {
        expectQueryKey(chainTemplateQueries.lists(), ['chain-templates', 'list']);
      });
    });

    describe('details()', () => {
      it('should return detail query key segment', () => {
        expectQueryKey(chainTemplateQueries.details(), ['chain-templates', 'detail']);
      });
    });
  });

  // ==========================================================================
  // List Query Tests
  // ==========================================================================

  describe('list()', () => {
    it('should return valid queryOptions', () => {
      const options = chainTemplateQueries.list();
      expectValidQueryOptions(options);
    });

    it('should have correct query key', () => {
      const options = chainTemplateQueries.list();
      expect(options.queryKey).toEqual(['chain-templates', 'list']);
    });

    it('should call getChainTemplates in queryFn', async () => {
      const mockResponses = [
        createMockChainTemplateResponse({ id: 1 }),
        createMockChainTemplateResponse({ id: 2, entityType: 'PURCHASE_ORDER' }),
      ];
      vi.mocked(getChainTemplates).mockResolvedValue(mockResponses);

      const options = chainTemplateQueries.list();
      await invokeQueryFn(options);

      expect(getChainTemplates).toHaveBeenCalled();
    });

    it('should map each template using chainTemplateMapper.toTemplate', async () => {
      const mockResponses = [
        createMockChainTemplateResponse({ id: 1 }),
        createMockChainTemplateResponse({ id: 2 }),
        createMockChainTemplateResponse({ id: 3 }),
      ];
      vi.mocked(getChainTemplates).mockResolvedValue(mockResponses);

      const options = chainTemplateQueries.list();
      const result = await invokeQueryFn<unknown[]>(options);

      expect(chainTemplateMapper.toTemplate).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('should return mapped templates', async () => {
      const mockResponses = [createMockChainTemplateResponse({ id: 1 })];
      vi.mocked(getChainTemplates).mockResolvedValue(mockResponses);

      const options = chainTemplateQueries.list();
      const result = await invokeQueryFn<Array<{ _mapped?: boolean }>>(options);

      expect(result[0]).toHaveProperty('_mapped', true);
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = chainTemplateQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = chainTemplateQueries.detail(123);
      expect(options.queryKey).toEqual(['chain-templates', 'detail', 123]);
    });

    it('should be enabled when id > 0', () => {
      const options = chainTemplateQueries.detail(123);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when id is 0', () => {
      const options = chainTemplateQueries.detail(0);
      expect(options.enabled).toBe(false);
    });

    it('should be disabled when id is negative', () => {
      const options = chainTemplateQueries.detail(-1);
      expect(options.enabled).toBe(false);
    });

    it('should call getChainTemplate with correct id in queryFn', async () => {
      const mockResponse = createMockChainTemplateResponse({ id: 123 });
      vi.mocked(getChainTemplate).mockResolvedValue(mockResponse);

      const options = chainTemplateQueries.detail(123);
      await invokeQueryFn(options);

      expect(getChainTemplate).toHaveBeenCalledWith(123);
    });

    it('should map response using chainTemplateMapper.toTemplate', async () => {
      const mockResponse = createMockChainTemplateResponse({ id: 123 });
      vi.mocked(getChainTemplate).mockResolvedValue(mockResponse);

      const options = chainTemplateQueries.detail(123);
      const result = await invokeQueryFn(options);

      expect(chainTemplateMapper.toTemplate).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });
  });
});
