/**
 * Chain Template Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { chainTemplateQueries } from './chain-template.queries';
import { expectValidQueryOptions, expectQueryKey } from '@/test/entity-test-utils';

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
        { id: 1, name: 'Quotation Approval', entityType: 'QUOTATION' },
        { id: 2, name: 'Project Approval', entityType: 'PROJECT' },
      ];
      vi.mocked(getChainTemplates).mockResolvedValue(mockResponses);

      const options = chainTemplateQueries.list();
      await options.queryFn();

      expect(getChainTemplates).toHaveBeenCalled();
    });

    it('should map each template using chainTemplateMapper.toTemplate', async () => {
      const mockResponses = [
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2' },
        { id: 3, name: 'Template 3' },
      ];
      vi.mocked(getChainTemplates).mockResolvedValue(mockResponses);

      const options = chainTemplateQueries.list();
      const result = await options.queryFn();

      expect(chainTemplateMapper.toTemplate).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('should return mapped templates', async () => {
      const mockResponses = [{ id: 1, name: 'Template 1' }];
      vi.mocked(getChainTemplates).mockResolvedValue(mockResponses);

      const options = chainTemplateQueries.list();
      const result = await options.queryFn();

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
      const mockResponse = { id: 123, name: 'Test Template', entityType: 'QUOTATION' };
      vi.mocked(getChainTemplate).mockResolvedValue(mockResponse);

      const options = chainTemplateQueries.detail(123);
      await options.queryFn();

      expect(getChainTemplate).toHaveBeenCalledWith(123);
    });

    it('should map response using chainTemplateMapper.toTemplate', async () => {
      const mockResponse = { id: 123, name: 'Test Template' };
      vi.mocked(getChainTemplate).mockResolvedValue(mockResponse);

      const options = chainTemplateQueries.detail(123);
      const result = await options.queryFn();

      expect(chainTemplateMapper.toTemplate).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });
  });
});
