/**
 * Unit tests for approvalChainService.
 * Tests admin approval chain operations, data transformation, and error propagation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { approvalChainService } from './approvalChainService';
import {
  createMockChainTemplate,
  createMockChainLevel,
  mockApiErrors,
} from '@/test/fixtures';
import type { ChainLevelRequest } from './types';
import { httpClient } from '@/api';

// Mock httpClient with inline factory (vi.mock is hoisted)
vi.mock('@/api', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    requestWithMeta: vi.fn(),
  },
  APPROVAL_CHAIN_ENDPOINTS: {
    BASE: '/admin/approval-chains',
    byId: (id: number) => `/admin/approval-chains/${id}`,
    levels: (id: number) => `/admin/approval-chains/${id}/levels`,
  },
}));

describe('approvalChainService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChainTemplates', () => {
    it('should fetch all chain templates and transform data', async () => {
      // Given: Mock templates response
      const mockTemplates = [
        createMockChainTemplate({ id: 1, entityType: 'QUOTATION' }),
        createMockChainTemplate({ id: 2, entityType: 'PURCHASE_ORDER' }),
      ];
      vi.mocked(httpClient.get).mockResolvedValue(mockTemplates);

      // When: Get chain templates
      const result = await approvalChainService.getChainTemplates();

      // Then: Calls httpClient with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/admin/approval-chains');

      // And: Returns transformed templates
      expect(result).toHaveLength(2);
      expect(result[0].entityType).toBe('QUOTATION');
      expect(result[1].entityType).toBe('PURCHASE_ORDER');
    });

    it('should trim whitespace from text fields', async () => {
      // Given: Response with whitespace
      const mockTemplates = [
        createMockChainTemplate({
          name: '  Test Chain  ',
          description: '  Description  ',
        }),
      ];
      vi.mocked(httpClient.get).mockResolvedValue(mockTemplates);

      // When: Get chain templates
      const result = await approvalChainService.getChainTemplates();

      // Then: Text fields are trimmed
      expect(result[0].name).toBe('Test Chain');
      expect(result[0].description).toBe('Description');
    });

    it('should trim whitespace from level fields', async () => {
      // Given: Template with whitespace in levels
      const mockTemplates = [
        createMockChainTemplate({
          levels: [
            createMockChainLevel({
              levelName: '  팀장  ',
              approverUserName: '  Team Lead  ',
            }),
          ],
        }),
      ];
      vi.mocked(httpClient.get).mockResolvedValue(mockTemplates);

      // When: Get chain templates
      const result = await approvalChainService.getChainTemplates();

      // Then: Level fields are trimmed
      const level = result[0].levels[0];
      expect(level.levelName).toBe('팀장');
      expect(level.approverUserName).toBe('Team Lead');
    });

    it('should handle empty results', async () => {
      // Given: Empty response
      vi.mocked(httpClient.get).mockResolvedValue([]);

      // When: Get chain templates
      const result = await approvalChainService.getChainTemplates();

      // Then: Returns empty array
      expect(result).toEqual([]);
    });

    it('should propagate API errors', async () => {
      // Given: API error
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.serverError);

      // When/Then: Propagates error
      await expect(approvalChainService.getChainTemplates()).rejects.toEqual(mockApiErrors.serverError);
    });
  });

  describe('getChainTemplate', () => {
    it('should fetch single chain template by ID and transform', async () => {
      // Given: Mock template response
      const mockTemplate = createMockChainTemplate({ id: 123 });
      vi.mocked(httpClient.get).mockResolvedValue(mockTemplate);

      // When: Get chain template by ID
      const result = await approvalChainService.getChainTemplate(123);

      // Then: Calls httpClient with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/admin/approval-chains/123');

      // And: Returns transformed template
      expect(result.id).toBe(123);
    });

    it('should handle null description', async () => {
      // Given: Template with null description
      const mockTemplate = createMockChainTemplate({ description: null });
      vi.mocked(httpClient.get).mockResolvedValue(mockTemplate);

      // When: Get chain template
      const result = await approvalChainService.getChainTemplate(1);

      // Then: Description remains null
      expect(result.description).toBeNull();
    });

    it('should handle empty levels', async () => {
      // Given: Template with no levels
      const mockTemplate = createMockChainTemplate({ levels: [] });
      vi.mocked(httpClient.get).mockResolvedValue(mockTemplate);

      // When: Get chain template
      const result = await approvalChainService.getChainTemplate(1);

      // Then: Returns empty levels array
      expect(result.levels).toEqual([]);
    });

    it('should propagate 404 errors', async () => {
      // Given: Template not found
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(approvalChainService.getChainTemplate(999)).rejects.toEqual(mockApiErrors.notFound);
    });
  });

  describe('updateChainLevels', () => {
    it('should update chain levels and return command result (CQRS)', async () => {
      // Given: Update request
      const levels: ChainLevelRequest[] = [
        { levelOrder: 1, levelName: '팀장', approverUserId: 10, isRequired: true },
        { levelOrder: 2, levelName: '부서장', approverUserId: 20, isRequired: true },
      ];

      // CQRS: Command returns { id, message } instead of full entity
      const mockCommandResult = { id: 50, message: 'Approval chain updated' };
      vi.mocked(httpClient.put).mockResolvedValue(mockCommandResult);

      // When: Update chain levels
      const result = await approvalChainService.updateChainLevels(50, levels);

      // Then: Calls httpClient.put with correct URL and data
      expect(httpClient.put).toHaveBeenCalledOnce();
      expect(httpClient.put).toHaveBeenCalledWith('/admin/approval-chains/50/levels', { levels });

      // And: Returns command result
      expect(result.id).toBe(50);
      expect(result.message).toBe('Approval chain updated');
    });

    it('should update to empty levels', async () => {
      // Given: Empty levels request
      const levels: ChainLevelRequest[] = [];

      const mockCommandResult = { id: 1, message: 'Approval chain updated' };
      vi.mocked(httpClient.put).mockResolvedValue(mockCommandResult);

      // When: Update chain levels
      const result = await approvalChainService.updateChainLevels(1, levels);

      // Then: Sends empty levels array
      expect(httpClient.put).toHaveBeenCalledWith('/admin/approval-chains/1/levels', { levels: [] });

      // And: Returns command result
      expect(result.id).toBe(1);
    });

    it('should propagate validation errors', async () => {
      // Given: Validation error
      vi.mocked(httpClient.put).mockRejectedValue(mockApiErrors.validation);

      // When/Then: Propagates validation error
      const levels: ChainLevelRequest[] = [
        { levelOrder: 1, levelName: '', approverUserId: 10, isRequired: true }, // Invalid: empty name
      ];
      await expect(approvalChainService.updateChainLevels(1, levels)).rejects.toEqual(mockApiErrors.validation);
    });

    it('should propagate 404 errors', async () => {
      // Given: Template not found
      vi.mocked(httpClient.put).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(approvalChainService.updateChainLevels(999, [])).rejects.toEqual(mockApiErrors.notFound);
    });

    it('should propagate authorization errors', async () => {
      // Given: Not admin
      vi.mocked(httpClient.put).mockRejectedValue(mockApiErrors.forbidden);

      // When/Then: Propagates forbidden
      await expect(approvalChainService.updateChainLevels(1, [])).rejects.toEqual(mockApiErrors.forbidden);
    });
  });
});
