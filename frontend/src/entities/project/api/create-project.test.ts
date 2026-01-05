/**
 * Create Project Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createProject, type CreateProjectInput } from './create-project';
import { DomainValidationError } from '@/shared/lib/errors/domain-validation-error';
import { createCommandResult } from '@/test/entity-test-utils';

// =============================================================================
// Mock Setup
// =============================================================================

const mockHttpClient = vi.hoisted(() => ({
  post: vi.fn(),
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

function createValidInput(overrides?: Partial<CreateProjectInput>): CreateProjectInput {
  return {
    customerId: 1,
    projectName: 'Test Project',
    requesterName: 'John Doe',
    dueDate: '2025-12-31',
    internalOwnerId: 2,
    ...overrides,
  };
}

describe('createProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue({
      ...createCommandResult(1),
      jobCode: 'WK22025-000001-20250101',
    });
  });

  // ==========================================================================
  // Validation Tests - Customer ID
  // ==========================================================================

  describe('validation - customerId', () => {
    it('should pass with valid customerId', async () => {
      const input = createValidInput({ customerId: 1 });
      await expect(createProject(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when customerId is null', async () => {
      const input = createValidInput({ customerId: null });

      await expect(createProject(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProject(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('customerId');
        expect(e.message).toContain('Customer');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Internal Owner ID
  // ==========================================================================

  describe('validation - internalOwnerId', () => {
    it('should pass with valid internalOwnerId', async () => {
      const input = createValidInput({ internalOwnerId: 2 });
      await expect(createProject(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when internalOwnerId is null', async () => {
      const input = createValidInput({ internalOwnerId: null });

      await expect(createProject(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProject(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('internalOwnerId');
        expect(e.message).toContain('Internal owner');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Project Name
  // ==========================================================================

  describe('validation - projectName', () => {
    it('should pass with valid projectName', async () => {
      const input = createValidInput({ projectName: 'Valid Project Name' });
      await expect(createProject(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when projectName is empty', async () => {
      const input = createValidInput({ projectName: '' });

      await expect(createProject(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProject(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('projectName');
        expect(e.message).toContain('Project name');
      }
    });

    it('should throw REQUIRED error when projectName is whitespace only', async () => {
      const input = createValidInput({ projectName: '   ' });

      await expect(createProject(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProject(input);
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
      await expect(createProject(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when dueDate is empty', async () => {
      const input = createValidInput({ dueDate: '' });

      await expect(createProject(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProject(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('dueDate');
        expect(e.message).toContain('Due date');
      }
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should trim projectName whitespace', async () => {
      const input = createValidInput({ projectName: '  Trimmed Project  ' });

      await createProject(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({ projectName: 'Trimmed Project' })
      );
    });

    it('should trim requesterName whitespace', async () => {
      const input = createValidInput({ requesterName: '  John Doe  ' });

      await createProject(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({ requesterName: 'John Doe' })
      );
    });

    it('should convert empty requesterName to undefined', async () => {
      const input = createValidInput({ requesterName: '   ' });

      await createProject(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({ requesterName: undefined })
      );
    });

    it('should pass undefined requesterName when not provided', async () => {
      const input = createValidInput({ requesterName: undefined });

      await createProject(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({ requesterName: undefined })
      );
    });

    it('should map all fields correctly', async () => {
      const input: CreateProjectInput = {
        customerId: 5,
        projectName: 'Test Project',
        requesterName: 'John Doe',
        dueDate: '2025-06-30',
        internalOwnerId: 10,
      };

      await createProject(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/projects', {
        customerId: 5,
        projectName: 'Test Project',
        requesterName: 'John Doe',
        dueDate: '2025-06-30',
        internalOwnerId: 10,
      });
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct endpoint', async () => {
      const input = createValidInput();

      await createProject(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/projects',
        expect.any(Object)
      );
    });

    it('should return CommandResult with jobCode on success', async () => {
      mockHttpClient.post.mockResolvedValue({
        id: 123,
        message: 'Created',
        jobCode: 'WK22025-000123-20250101',
      });
      const input = createValidInput();

      const result = await createProject(input);

      expect(result).toEqual({
        id: 123,
        message: 'Created',
        jobCode: 'WK22025-000123-20250101',
      });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);
      const input = createValidInput();

      await expect(createProject(input)).rejects.toThrow('Network error');
    });
  });
});
