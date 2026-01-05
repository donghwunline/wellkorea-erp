/**
 * Update Project Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { updateProject, type UpdateProjectInput } from './update-project';
import { DomainValidationError } from '@/shared/lib/errors/domain-validation-error';
import { createCommandResult } from '@/test/entity-test-utils';

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
    PROJECT_ENDPOINTS: {
      BASE: '/api/projects',
      byId: (id: number) => `/api/projects/${id}`,
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(overrides?: Partial<UpdateProjectInput>): UpdateProjectInput {
  return {
    projectName: 'Updated Project',
    requesterName: 'Jane Doe',
    dueDate: '2025-12-31',
    status: undefined,
    ...overrides,
  };
}

describe('updateProject', () => {
  const projectId = 123;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.put.mockResolvedValue({
      ...createCommandResult(projectId),
      jobCode: 'WK22025-000001-20250101',
    });
  });

  // ==========================================================================
  // Validation Tests - Project Name
  // ==========================================================================

  describe('validation - projectName', () => {
    it('should pass with valid projectName', async () => {
      const input = createValidInput({ projectName: 'Valid Name' });
      await expect(updateProject(projectId, input)).resolves.not.toThrow();
    });

    it('should pass when projectName is undefined (partial update)', async () => {
      const input = createValidInput({ projectName: undefined });
      await expect(updateProject(projectId, input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when projectName is empty string', async () => {
      const input = createValidInput({ projectName: '' });

      await expect(updateProject(projectId, input)).rejects.toThrow(DomainValidationError);

      try {
        await updateProject(projectId, input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('projectName');
        expect(e.message).toContain('cannot be empty');
      }
    });

    it('should throw REQUIRED error when projectName is whitespace only', async () => {
      const input = createValidInput({ projectName: '   ' });

      await expect(updateProject(projectId, input)).rejects.toThrow(DomainValidationError);

      try {
        await updateProject(projectId, input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('projectName');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Due Date
  // ==========================================================================

  describe('validation - dueDate', () => {
    it('should pass with valid dueDate', async () => {
      const input = createValidInput({ dueDate: '2025-12-31' });
      await expect(updateProject(projectId, input)).resolves.not.toThrow();
    });

    it('should pass when dueDate is undefined (partial update)', async () => {
      const input = createValidInput({ dueDate: undefined });
      await expect(updateProject(projectId, input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when dueDate is empty string', async () => {
      const input = createValidInput({ dueDate: '' });

      await expect(updateProject(projectId, input)).rejects.toThrow(DomainValidationError);

      try {
        await updateProject(projectId, input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('dueDate');
        expect(e.message).toContain('cannot be empty');
      }
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should trim projectName whitespace', async () => {
      const input = createValidInput({ projectName: '  Trimmed Project  ' });

      await updateProject(projectId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/projects/${projectId}`,
        expect.objectContaining({ projectName: 'Trimmed Project' })
      );
    });

    it('should pass undefined projectName when not provided', async () => {
      const input = createValidInput({ projectName: undefined });

      await updateProject(projectId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/projects/${projectId}`,
        expect.objectContaining({ projectName: undefined })
      );
    });

    it('should trim requesterName whitespace', async () => {
      const input = createValidInput({ requesterName: '  Jane Doe  ' });

      await updateProject(projectId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/projects/${projectId}`,
        expect.objectContaining({ requesterName: 'Jane Doe' })
      );
    });

    it('should convert empty requesterName to undefined', async () => {
      const input = createValidInput({ requesterName: '   ' });

      await updateProject(projectId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/projects/${projectId}`,
        expect.objectContaining({ requesterName: undefined })
      );
    });

    it('should pass status when provided', async () => {
      const input = createValidInput({ status: 'COMPLETED' });

      await updateProject(projectId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/projects/${projectId}`,
        expect.objectContaining({ status: 'COMPLETED' })
      );
    });

    it('should pass undefined status when not provided', async () => {
      const input = createValidInput({ status: undefined });

      await updateProject(projectId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/projects/${projectId}`,
        expect.objectContaining({ status: undefined })
      );
    });

    it('should map all fields correctly', async () => {
      const input: UpdateProjectInput = {
        projectName: 'Updated Project',
        requesterName: 'Jane Doe',
        dueDate: '2025-06-30',
        status: 'IN_PROGRESS',
      };

      await updateProject(projectId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(`/api/projects/${projectId}`, {
        projectName: 'Updated Project',
        requesterName: 'Jane Doe',
        dueDate: '2025-06-30',
        status: 'IN_PROGRESS',
      });
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.put with correct endpoint including id', async () => {
      const input = createValidInput();

      await updateProject(456, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/projects/456',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.put.mockResolvedValue({
        id: 123,
        message: 'Updated',
        jobCode: 'WK22025-000123-20250101',
      });
      const input = createValidInput();

      const result = await updateProject(projectId, input);

      expect(result).toEqual({
        id: 123,
        message: 'Updated',
        jobCode: 'WK22025-000123-20250101',
      });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.put.mockRejectedValue(error);
      const input = createValidInput();

      await expect(updateProject(projectId, input)).rejects.toThrow('Network error');
    });

    it('should handle different project IDs', async () => {
      const input = createValidInput();

      await updateProject(1, input);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/projects/1', expect.any(Object));

      await updateProject(999, input);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/projects/999', expect.any(Object));
    });
  });
});
