/**
 * Project Mapper Tests.
 *
 * Tests for DTO → Domain model transformations.
 */

import { describe, expect, it } from 'vitest';
import {
  projectMapper,
  type ProjectDetailsResponse,
  type ProjectListItemResponse,
} from './project.mapper';
import { expectDomainShape, expectTrimmedStrings } from '@/test/entity-test-utils';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockProjectDetailsResponse(
  overrides?: Partial<ProjectDetailsResponse>
): ProjectDetailsResponse {
  return {
    id: 1,
    jobCode: 'WK22025-000001-20250115',
    customerId: 100,
    customerName: 'Test Customer',
    projectName: 'Test Project',
    requesterName: 'John Doe',
    dueDate: '2025-02-28',
    internalOwnerId: 10,
    internalOwnerName: 'Jane Smith',
    status: 'IN_PROGRESS',
    createdById: 1,
    createdByName: 'Admin User',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}

function createMockProjectListItemResponse(
  overrides?: Partial<ProjectListItemResponse>
): ProjectListItemResponse {
  return {
    id: 1,
    jobCode: 'WK22025-000001-20250115',
    customerId: 100,
    customerName: 'Test Customer',
    projectName: 'Test Project',
    requesterName: 'John Doe',
    dueDate: '2025-02-28',
    status: 'IN_PROGRESS',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}

describe('projectMapper', () => {
  // ==========================================================================
  // toDomain Tests
  // ==========================================================================

  describe('toDomain()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockProjectDetailsResponse();
      const result = projectMapper.toDomain(response);

      expectDomainShape(result, [
        'id',
        'jobCode',
        'customerId',
        'customerName',
        'projectName',
        'requesterName',
        'dueDate',
        'internalOwnerId',
        'internalOwnerName',
        'status',
        'createdById',
        'createdByName',
        'createdAt',
        'updatedAt',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockProjectDetailsResponse();
      const result = projectMapper.toDomain(response);

      expect(result.id).toBe(1);
      expect(result.jobCode).toBe('WK22025-000001-20250115');
      expect(result.customerId).toBe(100);
      expect(result.internalOwnerId).toBe(10);
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should cast status string to ProjectStatus', () => {
      const response = createMockProjectDetailsResponse({ status: 'COMPLETED' });
      const result = projectMapper.toDomain(response);

      expect(result.status).toBe('COMPLETED');
    });

    it('should trim whitespace from projectName', () => {
      const response = createMockProjectDetailsResponse({
        projectName: '  Test Project  ',
      });
      const result = projectMapper.toDomain(response);

      expectTrimmedStrings(result, ['projectName']);
      expect(result.projectName).toBe('Test Project');
    });

    it('should trim whitespace from requesterName', () => {
      const response = createMockProjectDetailsResponse({
        requesterName: '  John Doe  ',
      });
      const result = projectMapper.toDomain(response);

      expect(result.requesterName).toBe('John Doe');
    });

    it('should handle null requesterName', () => {
      const response = createMockProjectDetailsResponse({ requesterName: null });
      const result = projectMapper.toDomain(response);

      expect(result.requesterName).toBeNull();
    });

    it('should handle null customerName', () => {
      const response = createMockProjectDetailsResponse({ customerName: null });
      const result = projectMapper.toDomain(response);

      expect(result.customerName).toBeNull();
    });

    it('should handle null internalOwnerName', () => {
      const response = createMockProjectDetailsResponse({ internalOwnerName: null });
      const result = projectMapper.toDomain(response);

      expect(result.internalOwnerName).toBeNull();
    });

    it('should handle null createdByName', () => {
      const response = createMockProjectDetailsResponse({ createdByName: null });
      const result = projectMapper.toDomain(response);

      expect(result.createdByName).toBeNull();
    });

    it('should preserve date strings in ISO format', () => {
      const response = createMockProjectDetailsResponse({
        dueDate: '2025-02-28',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-16T14:00:00Z',
      });
      const result = projectMapper.toDomain(response);

      expect(result.dueDate).toBe('2025-02-28');
      expect(result.createdAt).toBe('2025-01-15T10:30:00Z');
      expect(result.updatedAt).toBe('2025-01-16T14:00:00Z');
    });

    it('should default projectName to empty string when null', () => {
      const response = createMockProjectDetailsResponse({
        projectName: null as unknown as string,
      });
      const result = projectMapper.toDomain(response);

      expect(result.projectName).toBe('');
    });
  });

  // ==========================================================================
  // toListItem Tests
  // ==========================================================================

  describe('toListItem()', () => {
    it('should map only list-relevant fields', () => {
      const response = createMockProjectListItemResponse();
      const result = projectMapper.toListItem(response);

      expectDomainShape(result, [
        'id',
        'jobCode',
        'customerId',
        'customerName',
        'projectName',
        'requesterName',
        'dueDate',
        'status',
        'createdAt',
        'updatedAt',
      ]);
    });

    it('should not include internalOwnerId in list item', () => {
      const response = createMockProjectListItemResponse();
      const result = projectMapper.toListItem(response);

      expect(result).not.toHaveProperty('internalOwnerId');
    });

    it('should not include createdById in list item', () => {
      const response = createMockProjectListItemResponse();
      const result = projectMapper.toListItem(response);

      expect(result).not.toHaveProperty('createdById');
    });

    it('should trim whitespace from projectName', () => {
      const response = createMockProjectListItemResponse({
        projectName: '  Test Project  ',
      });
      const result = projectMapper.toListItem(response);

      expect(result.projectName).toBe('Test Project');
    });

    it('should trim whitespace from requesterName', () => {
      const response = createMockProjectListItemResponse({
        requesterName: '  John Doe  ',
      });
      const result = projectMapper.toListItem(response);

      expect(result.requesterName).toBe('John Doe');
    });

    it('should handle null requesterName', () => {
      const response = createMockProjectListItemResponse({ requesterName: null });
      const result = projectMapper.toListItem(response);

      expect(result.requesterName).toBeNull();
    });

    it('should handle null customerName', () => {
      const response = createMockProjectListItemResponse({ customerName: null });
      const result = projectMapper.toListItem(response);

      expect(result.customerName).toBeNull();
    });

    it('should preserve status value', () => {
      const response = createMockProjectListItemResponse({ status: 'COMPLETED' });
      const result = projectMapper.toListItem(response);

      expect(result.status).toBe('COMPLETED');
    });
  });
});
