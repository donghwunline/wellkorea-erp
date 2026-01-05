/**
 * Audit Mapper Tests.
 *
 * Tests for DTO → Domain model transformations.
 */

import { describe, expect, it } from 'vitest';
import { auditLogMapper, type AuditLogResponse } from './audit.mapper';
import { expectDomainShape } from '@/test/entity-test-utils';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockAuditLogResponse(
  overrides?: Partial<AuditLogResponse>
): AuditLogResponse {
  return {
    id: 1,
    entityType: 'QUOTATION',
    entityId: 100,
    action: 'CREATE',
    userId: 5,
    username: 'john.doe',
    ipAddress: '192.168.1.100',
    changes: '{"field":"value"}',
    metadata: '{"browser":"Chrome"}',
    createdAt: '2025-01-15T10:30:00Z',
    ...overrides,
  };
}

describe('auditLogMapper', () => {
  // ==========================================================================
  // toDomain Tests
  // ==========================================================================

  describe('toDomain()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockAuditLogResponse();
      const result = auditLogMapper.toDomain(response);

      expectDomainShape(result, [
        'id',
        'entityType',
        'entityId',
        'action',
        'userId',
        'username',
        'ipAddress',
        'changes',
        'metadata',
        'createdAt',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockAuditLogResponse();
      const result = auditLogMapper.toDomain(response);

      expect(result.id).toBe(1);
      expect(result.entityType).toBe('QUOTATION');
      expect(result.entityId).toBe(100);
      expect(result.action).toBe('CREATE');
      expect(result.userId).toBe(5);
      expect(result.username).toBe('john.doe');
      expect(result.ipAddress).toBe('192.168.1.100');
    });

    it('should handle null entityId', () => {
      const response = createMockAuditLogResponse({
        entityId: null,
      });
      const result = auditLogMapper.toDomain(response);

      expect(result.entityId).toBeNull();
    });

    it('should handle null userId', () => {
      const response = createMockAuditLogResponse({
        userId: null,
      });
      const result = auditLogMapper.toDomain(response);

      expect(result.userId).toBeNull();
    });

    it('should handle null username', () => {
      const response = createMockAuditLogResponse({
        username: null,
      });
      const result = auditLogMapper.toDomain(response);

      expect(result.username).toBeNull();
    });

    it('should handle null ipAddress', () => {
      const response = createMockAuditLogResponse({
        ipAddress: null,
      });
      const result = auditLogMapper.toDomain(response);

      expect(result.ipAddress).toBeNull();
    });

    it('should handle null changes', () => {
      const response = createMockAuditLogResponse({
        changes: null,
      });
      const result = auditLogMapper.toDomain(response);

      expect(result.changes).toBeNull();
    });

    it('should handle null metadata', () => {
      const response = createMockAuditLogResponse({
        metadata: null,
      });
      const result = auditLogMapper.toDomain(response);

      expect(result.metadata).toBeNull();
    });

    it('should preserve changes JSON string', () => {
      const changesJson = '{"oldValue":"A","newValue":"B"}';
      const response = createMockAuditLogResponse({
        changes: changesJson,
      });
      const result = auditLogMapper.toDomain(response);

      expect(result.changes).toBe(changesJson);
    });

    it('should preserve metadata JSON string', () => {
      const metadataJson = '{"browser":"Firefox","version":"120.0"}';
      const response = createMockAuditLogResponse({
        metadata: metadataJson,
      });
      const result = auditLogMapper.toDomain(response);

      expect(result.metadata).toBe(metadataJson);
    });

    it('should preserve date strings in ISO format', () => {
      const response = createMockAuditLogResponse({
        createdAt: '2025-01-15T14:30:45Z',
      });
      const result = auditLogMapper.toDomain(response);

      expect(result.createdAt).toBe('2025-01-15T14:30:45Z');
    });

    it('should handle different action types', () => {
      const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

      for (const action of actions) {
        const response = createMockAuditLogResponse({ action });
        const result = auditLogMapper.toDomain(response);
        expect(result.action).toBe(action);
      }
    });

    it('should handle different entity types', () => {
      const entityTypes = ['QUOTATION', 'PROJECT', 'COMPANY', 'USER'];

      for (const entityType of entityTypes) {
        const response = createMockAuditLogResponse({ entityType });
        const result = auditLogMapper.toDomain(response);
        expect(result.entityType).toBe(entityType);
      }
    });

    it('should handle system actions without user info', () => {
      const response = createMockAuditLogResponse({
        userId: null,
        username: null,
        action: 'SYSTEM_EVENT',
      });
      const result = auditLogMapper.toDomain(response);

      expect(result.userId).toBeNull();
      expect(result.username).toBeNull();
      expect(result.action).toBe('SYSTEM_EVENT');
    });
  });
});
