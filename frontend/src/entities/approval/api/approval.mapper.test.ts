/**
 * Approval Mapper Tests.
 *
 * Tests for DTO → Domain model transformations.
 */

import { describe, expect, it } from 'vitest';
import {
  approvalLevelMapper,
  approvalMapper,
  approvalHistoryMapper,
  type ApprovalDetailsResponse,
  type LevelDecisionResponse,
  type ApprovalHistoryResponse,
} from './approval.mapper';
import { expectDomainShape } from '@/test/entity-test-utils';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockLevelDecisionResponse(
  overrides?: Partial<LevelDecisionResponse>
): LevelDecisionResponse {
  return {
    levelOrder: 1,
    levelName: 'Manager',
    expectedApproverUserId: 10,
    expectedApproverName: 'John Manager',
    decision: 'PENDING',
    decidedByUserId: null,
    decidedByName: null,
    decidedAt: null,
    comments: null,
    ...overrides,
  };
}

function createMockApprovalDetailsResponse(
  overrides?: Partial<ApprovalDetailsResponse>
): ApprovalDetailsResponse {
  return {
    id: 1,
    entityType: 'QUOTATION',
    entityId: 100,
    entityDescription: 'Test Quotation',
    currentLevel: 1,
    totalLevels: 3,
    status: 'PENDING',
    submittedById: 5,
    submittedByName: 'Jane Submitter',
    submittedAt: '2025-01-15T10:00:00Z',
    completedAt: null,
    createdAt: '2025-01-15T09:00:00Z',
    levels: [createMockLevelDecisionResponse()],
    ...overrides,
  };
}

function createMockApprovalHistoryResponse(
  overrides?: Partial<ApprovalHistoryResponse>
): ApprovalHistoryResponse {
  return {
    id: 1,
    levelOrder: 1,
    levelName: 'Manager',
    action: 'APPROVED',
    actorId: 10,
    actorName: 'John Manager',
    comments: 'Approved',
    createdAt: '2025-01-15T11:00:00Z',
    ...overrides,
  };
}

describe('approvalLevelMapper', () => {
  // ==========================================================================
  // toDomain Tests
  // ==========================================================================

  describe('toDomain()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockLevelDecisionResponse();
      const result = approvalLevelMapper.toDomain(response);

      expectDomainShape(result, [
        'levelOrder',
        'levelName',
        'expectedApproverUserId',
        'expectedApproverName',
        'decision',
        'decidedByUserId',
        'decidedByName',
        'decidedAt',
        'comments',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockLevelDecisionResponse();
      const result = approvalLevelMapper.toDomain(response);

      expect(result.levelOrder).toBe(1);
      expect(result.levelName).toBe('Manager');
      expect(result.expectedApproverUserId).toBe(10);
      expect(result.expectedApproverName).toBe('John Manager');
      expect(result.decision).toBe('PENDING');
    });

    it('should trim levelName whitespace', () => {
      const response = createMockLevelDecisionResponse({
        levelName: '  Manager  ',
      });
      const result = approvalLevelMapper.toDomain(response);

      expect(result.levelName).toBe('Manager');
    });

    it('should trim expectedApproverName whitespace', () => {
      const response = createMockLevelDecisionResponse({
        expectedApproverName: '  John Manager  ',
      });
      const result = approvalLevelMapper.toDomain(response);

      expect(result.expectedApproverName).toBe('John Manager');
    });

    it('should handle approved level with all decision fields', () => {
      const response = createMockLevelDecisionResponse({
        decision: 'APPROVED',
        decidedByUserId: 10,
        decidedByName: '  John Manager  ',
        decidedAt: '2025-01-15T12:00:00Z',
        comments: '  Approved with comments  ',
      });
      const result = approvalLevelMapper.toDomain(response);

      expect(result.decision).toBe('APPROVED');
      expect(result.decidedByUserId).toBe(10);
      expect(result.decidedByName).toBe('John Manager');
      expect(result.decidedAt).toBe('2025-01-15T12:00:00Z');
      expect(result.comments).toBe('Approved with comments');
    });

    it('should handle null decidedByName', () => {
      const response = createMockLevelDecisionResponse({
        decidedByName: null,
      });
      const result = approvalLevelMapper.toDomain(response);

      expect(result.decidedByName).toBeNull();
    });

    it('should handle null comments', () => {
      const response = createMockLevelDecisionResponse({
        comments: null,
      });
      const result = approvalLevelMapper.toDomain(response);

      expect(result.comments).toBeNull();
    });
  });
});

describe('approvalMapper', () => {
  // ==========================================================================
  // toDomain Tests
  // ==========================================================================

  describe('toDomain()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockApprovalDetailsResponse();
      const result = approvalMapper.toDomain(response);

      expectDomainShape(result, [
        'id',
        'entityType',
        'entityId',
        'entityDescription',
        'currentLevel',
        'totalLevels',
        'status',
        'submittedById',
        'submittedByName',
        'submittedAt',
        'completedAt',
        'createdAt',
        'levels',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockApprovalDetailsResponse();
      const result = approvalMapper.toDomain(response);

      expect(result.id).toBe(1);
      expect(result.entityType).toBe('QUOTATION');
      expect(result.entityId).toBe(100);
      expect(result.currentLevel).toBe(1);
      expect(result.totalLevels).toBe(3);
      expect(result.status).toBe('PENDING');
      expect(result.submittedById).toBe(5);
    });

    it('should trim submittedByName whitespace', () => {
      const response = createMockApprovalDetailsResponse({
        submittedByName: '  Jane Submitter  ',
      });
      const result = approvalMapper.toDomain(response);

      expect(result.submittedByName).toBe('Jane Submitter');
    });

    it('should trim entityDescription whitespace', () => {
      const response = createMockApprovalDetailsResponse({
        entityDescription: '  Test Quotation  ',
      });
      const result = approvalMapper.toDomain(response);

      expect(result.entityDescription).toBe('Test Quotation');
    });

    it('should handle null entityDescription', () => {
      const response = createMockApprovalDetailsResponse({
        entityDescription: null,
      });
      const result = approvalMapper.toDomain(response);

      expect(result.entityDescription).toBeNull();
    });

    it('should handle null completedAt', () => {
      const response = createMockApprovalDetailsResponse({
        completedAt: null,
      });
      const result = approvalMapper.toDomain(response);

      expect(result.completedAt).toBeNull();
    });

    it('should handle completed approval', () => {
      const response = createMockApprovalDetailsResponse({
        status: 'APPROVED',
        completedAt: '2025-01-16T10:00:00Z',
      });
      const result = approvalMapper.toDomain(response);

      expect(result.status).toBe('APPROVED');
      expect(result.completedAt).toBe('2025-01-16T10:00:00Z');
    });

    it('should map levels array using approvalLevelMapper', () => {
      const response = createMockApprovalDetailsResponse({
        levels: [
          createMockLevelDecisionResponse({ levelOrder: 1, levelName: 'Manager' }),
          createMockLevelDecisionResponse({ levelOrder: 2, levelName: 'Director' }),
        ],
      });
      const result = approvalMapper.toDomain(response);

      expect(result.levels).toHaveLength(2);
      expect(result.levels![0].levelOrder).toBe(1);
      expect(result.levels![0].levelName).toBe('Manager');
      expect(result.levels![1].levelOrder).toBe(2);
      expect(result.levels![1].levelName).toBe('Director');
    });

    it('should handle null levels', () => {
      const response = createMockApprovalDetailsResponse({
        levels: null,
      });
      const result = approvalMapper.toDomain(response);

      expect(result.levels).toBeNull();
    });
  });

  // ==========================================================================
  // toListItem Tests
  // ==========================================================================

  describe('toListItem()', () => {
    it('should map only list-relevant fields', () => {
      const approval = approvalMapper.toDomain(createMockApprovalDetailsResponse());
      const result = approvalMapper.toListItem(approval);

      expectDomainShape(result, [
        'id',
        'entityType',
        'entityId',
        'entityDescription',
        'currentLevel',
        'totalLevels',
        'status',
        'submittedByName',
        'submittedAt',
      ]);
    });

    it('should not include submittedById in list item', () => {
      const approval = approvalMapper.toDomain(createMockApprovalDetailsResponse());
      const result = approvalMapper.toListItem(approval);

      expect(result).not.toHaveProperty('submittedById');
    });

    it('should not include levels in list item', () => {
      const approval = approvalMapper.toDomain(createMockApprovalDetailsResponse());
      const result = approvalMapper.toListItem(approval);

      expect(result).not.toHaveProperty('levels');
    });
  });

  // ==========================================================================
  // responseToListItem Tests
  // ==========================================================================

  describe('responseToListItem()', () => {
    it('should map response directly to list item', () => {
      const response = createMockApprovalDetailsResponse();
      const result = approvalMapper.responseToListItem(response);

      expectDomainShape(result, [
        'id',
        'entityType',
        'entityId',
        'entityDescription',
        'currentLevel',
        'totalLevels',
        'status',
        'submittedByName',
        'submittedAt',
      ]);
    });

    it('should trim entityDescription whitespace', () => {
      const response = createMockApprovalDetailsResponse({
        entityDescription: '  Test Quotation  ',
      });
      const result = approvalMapper.responseToListItem(response);

      expect(result.entityDescription).toBe('Test Quotation');
    });

    it('should trim submittedByName whitespace', () => {
      const response = createMockApprovalDetailsResponse({
        submittedByName: '  Jane Submitter  ',
      });
      const result = approvalMapper.responseToListItem(response);

      expect(result.submittedByName).toBe('Jane Submitter');
    });

    it('should handle null entityDescription', () => {
      const response = createMockApprovalDetailsResponse({
        entityDescription: null,
      });
      const result = approvalMapper.responseToListItem(response);

      expect(result.entityDescription).toBeNull();
    });
  });
});

describe('approvalHistoryMapper', () => {
  // ==========================================================================
  // toDomain Tests
  // ==========================================================================

  describe('toDomain()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockApprovalHistoryResponse();
      const result = approvalHistoryMapper.toDomain(response);

      expectDomainShape(result, [
        'id',
        'levelOrder',
        'levelName',
        'action',
        'actorId',
        'actorName',
        'comments',
        'createdAt',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockApprovalHistoryResponse();
      const result = approvalHistoryMapper.toDomain(response);

      expect(result.id).toBe(1);
      expect(result.levelOrder).toBe(1);
      expect(result.levelName).toBe('Manager');
      expect(result.action).toBe('APPROVED');
      expect(result.actorId).toBe(10);
      expect(result.actorName).toBe('John Manager');
    });

    it('should trim actorName whitespace', () => {
      const response = createMockApprovalHistoryResponse({
        actorName: '  John Manager  ',
      });
      const result = approvalHistoryMapper.toDomain(response);

      expect(result.actorName).toBe('John Manager');
    });

    it('should trim levelName whitespace', () => {
      const response = createMockApprovalHistoryResponse({
        levelName: '  Manager  ',
      });
      const result = approvalHistoryMapper.toDomain(response);

      expect(result.levelName).toBe('Manager');
    });

    it('should trim comments whitespace', () => {
      const response = createMockApprovalHistoryResponse({
        comments: '  Approved with changes  ',
      });
      const result = approvalHistoryMapper.toDomain(response);

      expect(result.comments).toBe('Approved with changes');
    });

    it('should handle null levelOrder', () => {
      const response = createMockApprovalHistoryResponse({
        levelOrder: null,
      });
      const result = approvalHistoryMapper.toDomain(response);

      expect(result.levelOrder).toBeNull();
    });

    it('should handle null levelName', () => {
      const response = createMockApprovalHistoryResponse({
        levelName: null,
      });
      const result = approvalHistoryMapper.toDomain(response);

      expect(result.levelName).toBeNull();
    });

    it('should handle null comments', () => {
      const response = createMockApprovalHistoryResponse({
        comments: null,
      });
      const result = approvalHistoryMapper.toDomain(response);

      expect(result.comments).toBeNull();
    });

    it('should handle SUBMITTED action', () => {
      const response = createMockApprovalHistoryResponse({
        action: 'SUBMITTED',
        levelOrder: null,
        levelName: null,
      });
      const result = approvalHistoryMapper.toDomain(response);

      expect(result.action).toBe('SUBMITTED');
      expect(result.levelOrder).toBeNull();
      expect(result.levelName).toBeNull();
    });
  });
});
