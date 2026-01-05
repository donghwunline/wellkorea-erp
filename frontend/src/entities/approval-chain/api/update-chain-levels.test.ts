/**
 * Update Chain Levels Command Tests.
 *
 * Tests for mapping and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { updateChainLevels } from './update-chain-levels';
import { createCommandResult } from '@/test/entity-test-utils';
import type { ChainLevelInput } from '../model/chain-template';

// =============================================================================
// Mock Setup
// =============================================================================

const mockHttpClient = vi.hoisted(() => ({
  put: vi.fn(),
}));

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api');
  return {
    ...actual,
    httpClient: mockHttpClient,
    APPROVAL_CHAIN_ENDPOINTS: {
      BASE: '/api/approval-chains',
      byId: (id: number) => `/api/approval-chains/${id}`,
      levels: (id: number) => `/api/approval-chains/${id}/levels`,
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidLevelInput(overrides?: Partial<ChainLevelInput>): ChainLevelInput {
  return {
    levelOrder: 1,
    levelName: 'Manager',
    approverUserId: 10,
    isRequired: true,
    ...overrides,
  };
}

describe('updateChainLevels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.put.mockResolvedValue(createCommandResult(123));
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should map single level correctly', async () => {
      const levels = [createValidLevelInput()];

      await updateChainLevels(123, levels);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/approval-chains/123/levels',
        {
          levels: [
            {
              levelOrder: 1,
              levelName: 'Manager',
              approverUserId: 10,
              isRequired: true,
            },
          ],
        }
      );
    });

    it('should map multiple levels correctly', async () => {
      const levels = [
        createValidLevelInput({ levelOrder: 1, levelName: 'Manager', approverUserId: 10 }),
        createValidLevelInput({ levelOrder: 2, levelName: 'Director', approverUserId: 20 }),
        createValidLevelInput({ levelOrder: 3, levelName: 'CEO', approverUserId: 30 }),
      ];

      await updateChainLevels(123, levels);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/approval-chains/123/levels',
        {
          levels: [
            { levelOrder: 1, levelName: 'Manager', approverUserId: 10, isRequired: true },
            { levelOrder: 2, levelName: 'Director', approverUserId: 20, isRequired: true },
            { levelOrder: 3, levelName: 'CEO', approverUserId: 30, isRequired: true },
          ],
        }
      );
    });

    it('should handle empty levels array', async () => {
      await updateChainLevels(123, []);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/approval-chains/123/levels',
        { levels: [] }
      );
    });

    it('should preserve isRequired value', async () => {
      const levels = [
        createValidLevelInput({ levelOrder: 1, isRequired: true }),
        createValidLevelInput({ levelOrder: 2, isRequired: false }),
      ];

      await updateChainLevels(123, levels);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/approval-chains/123/levels',
        {
          levels: [
            expect.objectContaining({ levelOrder: 1, isRequired: true }),
            expect.objectContaining({ levelOrder: 2, isRequired: false }),
          ],
        }
      );
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.put with correct endpoint', async () => {
      await updateChainLevels(456, [createValidLevelInput()]);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/approval-chains/456/levels',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.put.mockResolvedValue({ id: 123, message: 'Levels updated' });

      const result = await updateChainLevels(123, [createValidLevelInput()]);

      expect(result).toEqual({ id: 123, message: 'Levels updated' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.put.mockRejectedValue(error);

      await expect(updateChainLevels(123, [createValidLevelInput()])).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle different template IDs', async () => {
      const levels = [createValidLevelInput()];

      await updateChainLevels(1, levels);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/approval-chains/1/levels',
        expect.any(Object)
      );

      await updateChainLevels(999, levels);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/approval-chains/999/levels',
        expect.any(Object)
      );
    });
  });
});
