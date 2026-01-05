/**
 * Chain Template Mapper Tests.
 *
 * Tests for DTO → Domain model transformations.
 */

import { describe, expect, it } from 'vitest';
import {
  chainTemplateMapper,
  type ChainTemplateResponse,
  type ChainLevelResponse,
} from './chain-template.mapper';
import { expectDomainShape } from '@/test/entity-test-utils';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockChainLevelResponse(
  overrides?: Partial<ChainLevelResponse>
): ChainLevelResponse {
  return {
    id: 1,
    levelOrder: 1,
    levelName: 'Manager',
    approverUserId: 10,
    approverUserName: 'John Manager',
    isRequired: true,
    ...overrides,
  };
}

function createMockChainTemplateResponse(
  overrides?: Partial<ChainTemplateResponse>
): ChainTemplateResponse {
  return {
    id: 1,
    entityType: 'QUOTATION',
    name: 'Quotation Approval Chain',
    description: 'Standard approval chain for quotations',
    isActive: true,
    levels: [createMockChainLevelResponse()],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('chainTemplateMapper', () => {
  // ==========================================================================
  // toLevel Tests
  // ==========================================================================

  describe('toLevel()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockChainLevelResponse();
      const result = chainTemplateMapper.toLevel(response);

      expectDomainShape(result, [
        'id',
        'levelOrder',
        'levelName',
        'approverUserId',
        'approverUserName',
        'isRequired',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockChainLevelResponse();
      const result = chainTemplateMapper.toLevel(response);

      expect(result.id).toBe(1);
      expect(result.levelOrder).toBe(1);
      expect(result.levelName).toBe('Manager');
      expect(result.approverUserId).toBe(10);
      expect(result.approverUserName).toBe('John Manager');
      expect(result.isRequired).toBe(true);
    });

    it('should trim levelName whitespace', () => {
      const response = createMockChainLevelResponse({
        levelName: '  Manager  ',
      });
      const result = chainTemplateMapper.toLevel(response);

      expect(result.levelName).toBe('Manager');
    });

    it('should trim approverUserName whitespace', () => {
      const response = createMockChainLevelResponse({
        approverUserName: '  John Manager  ',
      });
      const result = chainTemplateMapper.toLevel(response);

      expect(result.approverUserName).toBe('John Manager');
    });

    it('should handle null levelName', () => {
      const response = createMockChainLevelResponse({
        levelName: null as unknown as string,
      });
      const result = chainTemplateMapper.toLevel(response);

      expect(result.levelName).toBe('');
    });

    it('should handle null approverUserName', () => {
      const response = createMockChainLevelResponse({
        approverUserName: null as unknown as string,
      });
      const result = chainTemplateMapper.toLevel(response);

      expect(result.approverUserName).toBe('');
    });

    it('should handle optional isRequired', () => {
      const response = createMockChainLevelResponse({ isRequired: false });
      const result = chainTemplateMapper.toLevel(response);

      expect(result.isRequired).toBe(false);
    });
  });

  // ==========================================================================
  // toTemplate Tests
  // ==========================================================================

  describe('toTemplate()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockChainTemplateResponse();
      const result = chainTemplateMapper.toTemplate(response);

      expectDomainShape(result, [
        'id',
        'entityType',
        'name',
        'description',
        'isActive',
        'levels',
        'createdAt',
        'updatedAt',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockChainTemplateResponse();
      const result = chainTemplateMapper.toTemplate(response);

      expect(result.id).toBe(1);
      expect(result.entityType).toBe('QUOTATION');
      expect(result.name).toBe('Quotation Approval Chain');
      expect(result.isActive).toBe(true);
    });

    it('should trim name whitespace', () => {
      const response = createMockChainTemplateResponse({
        name: '  Quotation Approval Chain  ',
      });
      const result = chainTemplateMapper.toTemplate(response);

      expect(result.name).toBe('Quotation Approval Chain');
    });

    it('should trim description whitespace', () => {
      const response = createMockChainTemplateResponse({
        description: '  Standard approval chain  ',
      });
      const result = chainTemplateMapper.toTemplate(response);

      expect(result.description).toBe('Standard approval chain');
    });

    it('should handle null name', () => {
      const response = createMockChainTemplateResponse({
        name: null as unknown as string,
      });
      const result = chainTemplateMapper.toTemplate(response);

      expect(result.name).toBe('');
    });

    it('should handle null description', () => {
      const response = createMockChainTemplateResponse({
        description: null,
      });
      const result = chainTemplateMapper.toTemplate(response);

      expect(result.description).toBeNull();
    });

    it('should map levels array using toLevel', () => {
      const response = createMockChainTemplateResponse({
        levels: [
          createMockChainLevelResponse({ levelOrder: 1, levelName: 'Manager' }),
          createMockChainLevelResponse({ levelOrder: 2, levelName: 'Director' }),
          createMockChainLevelResponse({ levelOrder: 3, levelName: 'CEO' }),
        ],
      });
      const result = chainTemplateMapper.toTemplate(response);

      expect(result.levels).toHaveLength(3);
      expect(result.levels[0].levelOrder).toBe(1);
      expect(result.levels[0].levelName).toBe('Manager');
      expect(result.levels[1].levelOrder).toBe(2);
      expect(result.levels[2].levelOrder).toBe(3);
    });

    it('should handle empty levels array', () => {
      const response = createMockChainTemplateResponse({
        levels: [],
      });
      const result = chainTemplateMapper.toTemplate(response);

      expect(result.levels).toEqual([]);
    });

    it('should handle null levels', () => {
      const response = createMockChainTemplateResponse({
        levels: null as unknown as ChainLevelResponse[],
      });
      const result = chainTemplateMapper.toTemplate(response);

      expect(result.levels).toEqual([]);
    });

    it('should handle inactive template', () => {
      const response = createMockChainTemplateResponse({
        isActive: false,
      });
      const result = chainTemplateMapper.toTemplate(response);

      expect(result.isActive).toBe(false);
    });

    it('should preserve date strings in ISO format', () => {
      const response = createMockChainTemplateResponse({
        createdAt: '2025-01-01T10:30:00Z',
        updatedAt: '2025-01-02T14:00:00Z',
      });
      const result = chainTemplateMapper.toTemplate(response);

      expect(result.createdAt).toBe('2025-01-01T10:30:00Z');
      expect(result.updatedAt).toBe('2025-01-02T14:00:00Z');
    });
  });
});
